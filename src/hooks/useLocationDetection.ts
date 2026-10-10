import { useState, useRef, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import {
  isDeviceLocationEnabled,
  promptEnableDeviceLocation,
  openDeviceLocationSettings,
  openAppPermissionSettings,
  checkAppLocationPermission,
  requestAppLocationPermission,
  type AppLocationPermissionStatus,
} from '../services/nativeSettingsService';
import { detectResilientLocation, type LocationGeoResult, NativeLocationError } from '../utils/geolocationHelper';
import { locationService, type LocationMatchResult } from '../services/locationService';
import { normalizeToEnglishText } from '../utils/indicTransliteration';
import { useToast } from '../context/ToastContext';

export interface LocationDetectionResult {
  geo: LocationGeoResult;
  match: LocationMatchResult | null;
  detectedState: string;
  detectedDistrict: string;
  detectedMandal: string;
  detectedCity: string;
  detectedStreet: string;
  detectedPin: string;
  isApproximate: boolean;
}

export interface UseLocationDetectionOptions {
  onSuccess: (result: LocationDetectionResult) => void;
  onError?: (error: any) => void;
  onClearFieldsForNewDetection?: () => void;
}

export function useLocationDetection({
  onSuccess,
  onError,
  onClearFieldsForNewDetection,
}: UseLocationDetectionOptions) {
  const { showToast } = useToast();

  const [detecting, setDetecting] = useState(false);
  const [showPermissionRationaleModal, setShowPermissionRationaleModal] = useState(false);
  const [showPermissionBlockedModal, setShowPermissionBlockedModal] = useState(false);
  const [showTurnOnModal, setShowTurnOnModal] = useState(false);

  // In-flight guard and monotonic attempt identifier to prevent stale overwrites
  const isDetectingRef = useRef(false);
  const attemptIdRef = useRef(0);
  const pendingSettingsReturnRef = useRef<{ id: number; target: 'location_settings' | 'app_settings' } | null>(null);

  /**
   * Executes physical coordinates and reverse geocoding for a specific attempt ID.
   */
  const executeDetection = useCallback(async (attemptId: number) => {
    if (attemptIdRef.current !== attemptId) return;

    isDetectingRef.current = true;
    setDetecting(true);

    try {
      if (import.meta.env.DEV && typeof window !== 'undefined' && (window as any).__forceLocationError) {
        throw (window as any).__forceLocationError;
      }

      onClearFieldsForNewDetection?.();

      // Acquire coordinates using native GPS/Network (no silent IP fallback for button clicks)
      const geo = await detectResilientLocation({ allowIpFallback: false });

      // Stale attempt guard: if user reset or started a newer attempt, discard
      if (attemptIdRef.current !== attemptId) return;

      const isApproximate = geo.source === 'network' || geo.permissionStatus === 'coarse' || (geo.accuracyMeters != null && geo.accuracyMeters > 150);

      // Extract fresh values only — NEVER fall back to old address fields
      const detectedState = normalizeToEnglishText(geo.state || '');
      const rawDistrict = normalizeToEnglishText(geo.district || '');
      const detectedMandal = normalizeToEnglishText(geo.mandal || '');
      const detectedCity = normalizeToEnglishText(geo.city || '');
      const detectedStreet = normalizeToEnglishText(geo.street || '');
      const detectedPin = geo.pinCode || '';

      let match: LocationMatchResult | null = null;
      if (detectedState || rawDistrict) {
        try {
          match = await locationService.matchLocation({
            state: detectedState,
            district: rawDistrict,
            mandal: detectedMandal,
            locality: detectedCity,
            pinCode: detectedPin,
            stateCode: geo.stateCode,
            districtCode: geo.districtCode,
            subDistrictCode: geo.subDistrictCode,
          });
        } catch (matchErr) {
          console.warn('[useLocationDetection] matchLocation notice:', matchErr);
        }
      }

      if (attemptIdRef.current !== attemptId) return;

      if (isApproximate) {
        showToast(
          `📍 Approximate location detected (±${Math.round(geo.accuracyMeters || 200)}m). Please verify your Mandal & details.`,
          'info'
        );
      }

      onSuccess({
        geo,
        match,
        detectedState,
        detectedDistrict: rawDistrict,
        detectedMandal,
        detectedCity,
        detectedStreet,
        detectedPin,
        isApproximate,
      });
    } catch (err: any) {
      if (attemptIdRef.current !== attemptId) return;

      if (err instanceof NativeLocationError) {
        if (err.code === 'LOCATION_SERVICES_DISABLED') {
          setShowTurnOnModal(true);
          return;
        }
        if (err.code === 'PERMISSION_DENIED') {
          setShowPermissionBlockedModal(true);
          return;
        }
      }

      console.warn('[useLocationDetection] Detection failed:', err);
      showToast('Could not detect location. Please select your area manually.', 'info');
      onError?.(err);
    } finally {
      if (attemptIdRef.current === attemptId) {
        isDetectingRef.current = false;
        setDetecting(false);
      }
    }
  }, [onSuccess, onError, onClearFieldsForNewDetection, showToast]);

  /**
   * Main entry point when user taps "Detect Location", "Detect Location Again", or "Auto-Locate".
   */
  const triggerDetectLocation = useCallback(async (options?: { bypassRationale?: boolean }) => {
    // 1. Prevent concurrent runs
    if (isDetectingRef.current) return;

    pendingSettingsReturnRef.current = null;
    const currentAttemptId = ++attemptIdRef.current;

    // 2. Check app permission state
    const permStatus: AppLocationPermissionStatus = await checkAppLocationPermission();

    if (permStatus === 'prompt' && !options?.bypassRationale) {
      setShowPermissionRationaleModal(true);
      return;
    }

    if (permStatus === 'denied') {
      setShowPermissionBlockedModal(true);
      return;
    }

    // 3. Check device location services (GPS switch) on native platforms
    if (Capacitor.isNativePlatform()) {
      const isLocationOn = await isDeviceLocationEnabled();
      if (!isLocationOn) {
        // Trigger Google Play Services in-app Location resolution dialog
        const promptRes = await promptEnableDeviceLocation();

        if (promptRes.enabled) {
          showToast('Device location enabled. Detecting your area...', 'info');
          await executeDetection(currentAttemptId);
          return;
        }

        if (promptRes.status === 'cancelled') {
          // User chose "No thanks" or pressed Back. End attempt gracefully.
          showToast('Device location is required to auto-detect. You can enter details manually or try again.', 'info');
          return;
        }

        // Dialog unavailable or technical failure: offer opening Location Settings
        setShowTurnOnModal(true);
        return;
      }
    }

    // Prerequisites ready: execute detection
    await executeDetection(currentAttemptId);
  }, [executeDetection, showToast]);

  /**
   * Called when user continues from the in-app permission rationale modal.
   */
  const handlePermissionRationaleContinue = useCallback(async () => {
    setShowPermissionRationaleModal(false);
    const currentAttemptId = ++attemptIdRef.current;

    if (Capacitor.isNativePlatform()) {
      const reqStatus = await requestAppLocationPermission();
      if (reqStatus === 'granted' || reqStatus === 'approximate') {
        const isLocationOn = await isDeviceLocationEnabled();
        if (!isLocationOn) {
          const promptRes = await promptEnableDeviceLocation();
          if (promptRes.enabled) {
            await executeDetection(currentAttemptId);
            return;
          }
          if (promptRes.status === 'cancelled') {
            showToast('Device location is off. You can enter details manually.', 'info');
            return;
          }
          setShowTurnOnModal(true);
          return;
        }
        await executeDetection(currentAttemptId);
      } else if (reqStatus === 'denied') {
        setShowPermissionBlockedModal(true);
      } else {
        showToast('Location access was not granted. Please enter your location manually.', 'info');
      }
    } else {
      await executeDetection(currentAttemptId);
    }
  }, [executeDetection, showToast]);

  /**
   * User chooses to open Android Location settings from TurnOnModal.
   */
  const handleOpenLocationSettings = useCallback(async () => {
    setShowTurnOnModal(false);
    const currentAttemptId = ++attemptIdRef.current;
    pendingSettingsReturnRef.current = { id: currentAttemptId, target: 'location_settings' };

    const opened = await openDeviceLocationSettings();
    if (!opened) {
      pendingSettingsReturnRef.current = null;
      showToast('Could not open Location Settings. Please enable Location manually in your notification quick settings.', 'info');
    }
  }, [showToast]);

  /**
   * User chooses to open Android App permission settings from PermissionBlockedModal.
   */
  const handleOpenAppSettings = useCallback(async () => {
    setShowPermissionBlockedModal(false);
    const currentAttemptId = ++attemptIdRef.current;
    pendingSettingsReturnRef.current = { id: currentAttemptId, target: 'app_settings' };

    const opened = await openAppPermissionSettings();
    if (!opened) {
      pendingSettingsReturnRef.current = null;
      showToast('Could not open App Settings. Please enable Location in your phone Settings -> Apps.', 'info');
    }
  }, [showToast]);

  /**
   * Cancels in-flight detection or pending attempts.
   */
  const cancelDetection = useCallback(() => {
    attemptIdRef.current++;
    pendingSettingsReturnRef.current = null;
    isDetectingRef.current = false;
    setDetecting(false);
    setShowPermissionRationaleModal(false);
    setShowPermissionBlockedModal(false);
    setShowTurnOnModal(false);
  }, []);

  /**
   * Handles return from Settings Activity (native appStateChange / web focus).
   */
  const handleSettingsReturn = useCallback(async () => {
    const pending = pendingSettingsReturnRef.current;
    if (!pending || isDetectingRef.current) return;

    // Clear pending flag immediately so it cannot trigger multiple times
    pendingSettingsReturnRef.current = null;
    const attemptId = pending.id;

    // Recheck both device location and app permissions
    const isLocationOn = await isDeviceLocationEnabled();
    const permStatus = await checkAppLocationPermission();
    const isPermReady = permStatus === 'granted' || permStatus === 'approximate';

    if (isLocationOn && isPermReady) {
      showToast('Location ready. Detecting your area...', 'info');
      await executeDetection(attemptId);
    } else {
      // Prerequisites still missing: end attempt cleanly, provide non-blocking feedback
      isDetectingRef.current = false;
      setDetecting(false);
      showToast('Location was not enabled. You can select your area manually or try again.', 'info');
    }
  }, [executeDetection, showToast]);

  // Return-from-Settings lifecycle listeners
  useEffect(() => {
    let isMounted = true;
    let nativeHandle: any = null;

    if (Capacitor.isNativePlatform()) {
      App.addListener('appStateChange', (state) => {
        if (!isMounted) return;
        if (state.isActive) {
          handleSettingsReturn();
        }
      }).then((handle) => {
        if (!isMounted) {
          handle.remove();
        } else {
          nativeHandle = handle;
        }
      }).catch((err) => {
        console.warn('[useLocationDetection] App.addListener error:', err);
      });
    } else {
      const onFocus = () => {
        if (isMounted) handleSettingsReturn();
      };
      const onVisibilityChange = () => {
        if (isMounted && document.visibilityState === 'visible') handleSettingsReturn();
      };

      window.addEventListener('focus', onFocus);
      document.addEventListener('visibilitychange', onVisibilityChange);

      return () => {
        isMounted = false;
        window.removeEventListener('focus', onFocus);
        document.removeEventListener('visibilitychange', onVisibilityChange);
      };
    }

    return () => {
      isMounted = false;
      pendingSettingsReturnRef.current = null;
      attemptIdRef.current++;
      isDetectingRef.current = false;
      if (nativeHandle) {
        nativeHandle.remove();
      }
    };
  }, [handleSettingsReturn]);

  return {
    detecting,
    showPermissionRationaleModal,
    setShowPermissionRationaleModal,
    showPermissionBlockedModal,
    setShowPermissionBlockedModal,
    showTurnOnModal,
    setShowTurnOnModal,
    triggerDetectLocation,
    handlePermissionRationaleContinue,
    handleOpenLocationSettings,
    handleOpenAppSettings,
    cancelDetection,
  };
}
