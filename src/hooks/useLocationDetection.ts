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
  onSuccess: (result: LocationDetectionResult) => void | Promise<void>;
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
  const callbacksRef = useRef({ onSuccess, onError, onClearFieldsForNewDetection });
  useEffect(() => {
    callbacksRef.current = { onSuccess, onError, onClearFieldsForNewDetection };
  }, [onSuccess, onError, onClearFieldsForNewDetection]);

  /**
   * Executes physical coordinates and reverse geocoding for a specific attempt ID.
   */
  const executeDetection = useCallback(async (attemptId: number) => {
    if (attemptIdRef.current !== attemptId) return;

    isDetectingRef.current = true;
    setDetecting(true);

    let watchdogTimer: ReturnType<typeof setTimeout> | undefined;

    try {
      if (import.meta.env.DEV && typeof window !== 'undefined' && (window as any).__forceLocationError) {
        throw (window as any).__forceLocationError;
      }

      callbacksRef.current.onClearFieldsForNewDetection?.();

      // Bound the whole resolver to 6 seconds so users never wait indefinitely
      const geo = await Promise.race([
        detectResilientLocation({ allowIpFallback: true }),
        new Promise<never>((_, reject) => {
          watchdogTimer = setTimeout(() => reject(new NativeLocationError('TIMEOUT', 'Location detection timed out after 6 seconds')), 6000);
        }),
      ]);

      // Stale attempt guard: if user reset or started a newer attempt, discard
      if (attemptIdRef.current !== attemptId) return;

      const isApproximate = geo.source === 'network' || geo.source === 'ip' || geo.permissionStatus === 'coarse' || (geo.accuracyMeters != null && geo.accuracyMeters > 150);

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
          if (geo.stateCode && geo.districtCode && geo.subDistrictCode) {
            const stateObj = locationService.getState(geo.stateCode);
            const distObj = locationService.getDistrict(geo.stateCode, geo.districtCode);
            const subObj = locationService.getSubDistrict(geo.districtCode, geo.subDistrictCode);
            if (stateObj && distObj && subObj) {
              match = {
                state: stateObj,
                district: distObj,
                subDistrict: subObj,
                locality: detectedCity && detectedCity.toLowerCase() !== subObj.subDistrictName.toLowerCase() ? {
                  localityCode: 999999,
                  localityName: detectedCity,
                  localityType: 'URBAN_LOCALITY',
                  subDistrictCode: subObj.subDistrictCode,
                  subDistrictName: subObj.subDistrictName,
                  subDistrictType: (subObj.subDistrictType as any) || 'Mandal',
                  districtCode: distObj.districtCode,
                  districtName: distObj.districtName,
                  stateCode: stateObj.code,
                  stateName: stateObj.name,
                } : undefined,
              };
            }
          }
          if (!match) {
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
          }
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

      await callbacksRef.current.onSuccess({
        geo,
        match,
        detectedState: detectedState || match?.state?.name || '',
        detectedDistrict: rawDistrict || match?.district?.districtName || '',
        detectedMandal: detectedMandal || match?.subDistrict?.subDistrictName || '',
        detectedCity: detectedCity || match?.locality?.localityName || '',
        detectedStreet,
        detectedPin,
        isApproximate,
      });
    } catch (err: any) {
      if (attemptIdRef.current !== attemptId) return;

      if (err instanceof NativeLocationError && Capacitor.isNativePlatform()) {
        if (err.code === 'LOCATION_SERVICES_DISABLED') {
          setShowTurnOnModal(true);
          return;
        }
        if (err.code === 'PERMISSION_DENIED') {
          const isLocOn = await isDeviceLocationEnabled();
          if (attemptIdRef.current !== attemptId) return;
          if (!isLocOn) {
            setShowTurnOnModal(true);
            return;
          }
          setShowPermissionBlockedModal(true);
          return;
        }
      }

      console.warn('[useLocationDetection] Detection failed or timed out, loading fallback cards:', err);
      showToast('⚠️ Could not detect GPS coordinates. Loaded default area cards. Please verify details.', 'warning');

      // Populate resilient fallback cards (State, District, Mandal, Home Base with Village & PIN)
      const fallbackGeo: LocationGeoResult = {
        latitude: 16.7725,
        longitude: 81.6854,
        state: 'Andhra Pradesh',
        district: 'East Godavari',
        mandal: 'Undrajavaram',
        city: 'Palangi',
        pinCode: '534216',
        source: 'network',
        accuracyMeters: 500,
        stateCode: 28,
        districtCode: 505,
        subDistrictCode: 4970,
        confidence: 'LOW',
        confidenceReason: 'Fallback default location populated due to GPS detection timeout',
        boundaryMatched: true,
        permissionStatus: 'coarse',
      };

      let fallbackMatch: LocationMatchResult | null = null;
      try {
        fallbackMatch = await locationService.matchLocation({
          state: 'Andhra Pradesh',
          district: 'East Godavari',
          mandal: 'Undrajavaram',
          locality: 'Palangi',
          pinCode: '534216',
          stateCode: 28,
          districtCode: 505,
          subDistrictCode: 4970,
        });
      } catch (matchErr) {
        console.warn('[useLocationDetection] fallback matchLocation notice:', matchErr);
      }

      await callbacksRef.current.onSuccess({
        geo: fallbackGeo,
        match: fallbackMatch,
        detectedState: 'Andhra Pradesh',
        detectedDistrict: 'East Godavari',
        detectedMandal: 'Undrajavaram',
        detectedCity: 'Palangi',
        detectedStreet: '',
        detectedPin: '534216',
        isApproximate: true,
      });

      callbacksRef.current.onError?.(err);
    } finally {
      clearTimeout(watchdogTimer);
      if (attemptIdRef.current === attemptId) {
        isDetectingRef.current = false;
        setDetecting(false);
      }
    }
  }, [showToast]);

  /**
   * Main entry point when user taps "Detect Location", "Detect Location Again", or "Auto-Locate".
   */
  const triggerDetectLocation = useCallback(async (options?: { bypassRationale?: boolean }) => {
    // 1. Prevent concurrent runs
    if (isDetectingRef.current) return;

    pendingSettingsReturnRef.current = null;
    const currentAttemptId = ++attemptIdRef.current;
    isDetectingRef.current = true;
    setDetecting(true);

    try {
      // 2. Check device location services (GPS switch) FIRST on native platforms
      if (Capacitor.isNativePlatform()) {
        const isLocationOn = await isDeviceLocationEnabled();
        if (attemptIdRef.current !== currentAttemptId) return;
        if (!isLocationOn) {
          // Trigger Google Play Services in-app Location resolution dialog
          const promptRes = await promptEnableDeviceLocation();
          if (attemptIdRef.current !== currentAttemptId) return;

          if (promptRes.enabled) {
            showToast('Device location enabled. Detecting your area...', 'info');
            // Device GPS enabled: fall through to permission check and detection!
          } else if (promptRes.status === 'cancelled') {
            // User chose "No thanks" or pressed Back. End attempt gracefully.
            showToast('Device location is required to auto-detect. You can enter details manually or try again.', 'info');
            isDetectingRef.current = false;
            setDetecting(false);
            return;
          } else {
            // Dialog unavailable or technical failure: offer opening Location Settings
            isDetectingRef.current = false;
            setDetecting(false);
            setShowTurnOnModal(true);
            return;
          }
        }
      }

      // 3. Check and request app permission state
      let permStatus: AppLocationPermissionStatus = await checkAppLocationPermission();
      if (attemptIdRef.current !== currentAttemptId) return;

      if (permStatus === 'prompt') {
        if (!options?.bypassRationale) {
          permStatus = await requestAppLocationPermission();
          if (attemptIdRef.current !== currentAttemptId) return;
        }
      }

      if (permStatus === 'denied') {
        const isLocationOn = await isDeviceLocationEnabled();
        if (attemptIdRef.current !== currentAttemptId) return;
        isDetectingRef.current = false;
        setDetecting(false);
        if (!isLocationOn) {
          setShowTurnOnModal(true);
          return;
        }
        setShowPermissionBlockedModal(true);
        return;
      }

      // 4. Prerequisites ready: execute detection immediately
      await executeDetection(currentAttemptId);
    } catch (err) {
      if (attemptIdRef.current !== currentAttemptId) return;
      console.warn('[useLocationDetection] triggerDetectLocation error:', err);
      isDetectingRef.current = false;
      setDetecting(false);
    }
  }, [executeDetection, showToast]);

  /**
   * Called when user continues from the in-app permission rationale modal.
   */
  const handlePermissionRationaleContinue = useCallback(async () => {
    setShowPermissionRationaleModal(false);
    await triggerDetectLocation();
  }, [triggerDetectLocation]);

  /**
   * User chooses to open Android Location settings from TurnOnModal or PermissionBlockedModal.
   * Directly opens Android's Location Settings (Settings.ACTION_LOCATION_SOURCE_SETTINGS)
   * where the user can toggle GPS on or off.
   */
  const handleOpenLocationSettings = useCallback(async () => {
    setShowTurnOnModal(false);
    setShowPermissionBlockedModal(false);
    const currentAttemptId = ++attemptIdRef.current;
    pendingSettingsReturnRef.current = { id: currentAttemptId, target: 'location_settings' };

    const opened = await openDeviceLocationSettings();
    if (!opened) {
      pendingSettingsReturnRef.current = null;
      showToast('Could not open Location Settings. Please enable Location manually in your notification quick settings.', 'info');
    }
  }, [showToast]);

  /**
   * User chooses to open settings from PermissionBlockedModal.
   * App permission denial must open this application's permission settings.
   */
  const handleOpenAppSettings = useCallback(async () => {
    setShowPermissionBlockedModal(false);
    const currentAttemptId = ++attemptIdRef.current;

    pendingSettingsReturnRef.current = { id: currentAttemptId, target: 'app_settings' };
    const opened = await openAppPermissionSettings();
    if (!opened) {
      pendingSettingsReturnRef.current = null;
      showToast('Allow location for FindLostPuppy in your app or browser permissions, then try again.', 'info');
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
    if (attemptIdRef.current !== attemptId) return;
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
        pendingSettingsReturnRef.current = null;
        attemptIdRef.current++;
        isDetectingRef.current = false;
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
