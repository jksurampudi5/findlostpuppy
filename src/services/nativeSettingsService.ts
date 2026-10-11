
import { Capacitor, registerPlugin } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

export type PromptLocationStatus =
  | 'already_enabled'
  | 'enabled'
  | 'cancelled'
  | 'launch_failed'
  | 'unavailable'
  | 'failed_to_enable'
  | 'error';

export interface PromptLocationResult {
  resolved: boolean;
  enabled: boolean;
  status: PromptLocationStatus;
}

export type AppLocationPermissionStatus = 'granted' | 'approximate' | 'prompt' | 'denied';

interface DeviceSettingsPlugin {
  isLocationEnabled(): Promise<{ enabled: boolean }>;
  promptEnableLocation(): Promise<{
    resolved: boolean;
    enabled?: boolean;
    alreadyEnabled?: boolean;
    status?: PromptLocationStatus;
  }>;
  openLocationSettings(): Promise<{ opened: boolean; error?: string }>;
  openAppSettings(): Promise<{ opened: boolean; error?: string }>;
}

const DeviceSettings = registerPlugin<DeviceSettingsPlugin>('DeviceSettings');

/**
 * Checks whether device Location services (GPS master switch) are enabled.
 */
export async function isDeviceLocationEnabled(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    return true; // Browser handles this via navigator.geolocation directly
  }

  try {
    const result = await DeviceSettings.isLocationEnabled();
    return Boolean(result?.enabled);
  } catch (error) {
    console.warn('[nativeSettingsService] Unable to check device location status:', error);
    return true;
  }
}

/**
 * Triggers Google Play Services in-app Location resolution dialog if disabled.
 * Settle with explicit status ('enabled', 'cancelled', 'unavailable', etc.).
 */
export async function promptEnableDeviceLocation(): Promise<PromptLocationResult> {
  if (!Capacitor.isNativePlatform()) {
    return { resolved: true, enabled: true, status: 'already_enabled' };
  }

  try {
    const alreadyOn = await isDeviceLocationEnabled();
    if (alreadyOn) {
      return { resolved: true, enabled: true, status: 'already_enabled' };
    }

    let pollTimer: any = null;
    const pollGpsPromise = new Promise<PromptLocationResult>((resolve) => {
      let checks = 0;
      pollTimer = setInterval(async () => {
        checks++;
        const enabled = await isDeviceLocationEnabled();
        if (enabled) {
          if (pollTimer) clearInterval(pollTimer);
          resolve({ resolved: true, enabled: true, status: 'enabled' });
        } else if (checks >= 40) { // 10 seconds (40 * 250ms)
          if (pollTimer) clearInterval(pollTimer);
          resolve({ resolved: false, enabled: false, status: 'cancelled' });
        }
      }, 250);
    });

    const nativePromise = (async (): Promise<PromptLocationResult> => {
      const result = await DeviceSettings.promptEnableLocation();
      const enabled = Boolean(result?.enabled || result?.alreadyEnabled);
      const status: PromptLocationStatus =
        (result?.status as PromptLocationStatus) || (enabled ? 'enabled' : 'unavailable');
      return {
        resolved: Boolean(result?.resolved),
        enabled,
        status,
      };
    })();

    const winner = await Promise.race([nativePromise, pollGpsPromise]);
    if (pollTimer) clearInterval(pollTimer);
    return winner;
  } catch (error) {
    console.warn('[nativeSettingsService] Unable to show Android Location enable dialog:', error);
    return { resolved: false, enabled: false, status: 'error' };
  }
}

/**
 * Opens native Android Location Source Settings.
 */
export async function openDeviceLocationSettings(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }

  try {
    const result = await DeviceSettings.openLocationSettings();
    return Boolean(result?.opened);
  } catch (error) {
    console.warn('[nativeSettingsService] Unable to open device Location settings:', error);
    return false;
  }
}

/**
 * Opens native Android App Details Settings (to change runtime permissions).
 */
export async function openAppPermissionSettings(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }

  try {
    const result = await DeviceSettings.openAppSettings();
    return Boolean(result?.opened);
  } catch (error) {
    console.warn('[nativeSettingsService] Unable to open app permission settings:', error);
    return false;
  }
}

/**
 * Accurately checks current app location permission state across platforms,
 * explicitly respecting approximate (coarse) permission.
 */
export async function checkAppLocationPermission(): Promise<AppLocationPermissionStatus> {
  if (!Capacitor.isNativePlatform()) {
    if (typeof navigator === 'undefined' || !navigator.permissions) {
      return 'prompt';
    }
    try {
      const status = await navigator.permissions.query({ name: 'geolocation' });
      if (status.state === 'granted') return 'granted';
      if (status.state === 'denied') return 'denied';
      return 'prompt';
    } catch {
      return 'prompt';
    }
  }

  try {
    const perm = await Geolocation.checkPermissions();
    if (perm.location === 'granted') return 'granted';
    if (perm.coarseLocation === 'granted') return 'approximate';
    if (perm.location === 'denied' && perm.coarseLocation === 'denied') return 'denied';
    return 'prompt';
  } catch (error) {
    console.warn('[nativeSettingsService] checkPermissions error:', error);
    // If device location is disabled, some Android versions may throw: treat as prompt
    return 'prompt';
  }
}

/**
 * Prompts user for app location permission and returns resulting state.
 */
export async function requestAppLocationPermission(): Promise<AppLocationPermissionStatus> {
  if (!Capacitor.isNativePlatform()) {
    return 'prompt';
  }

  try {
    const req = await Geolocation.requestPermissions();
    if (req.location === 'granted') return 'granted';
    if (req.coarseLocation === 'granted') return 'approximate';
    if (req.location === 'denied' && req.coarseLocation === 'denied') return 'denied';
    return 'prompt';
  } catch (error) {
    console.warn('[nativeSettingsService] requestPermissions error:', error);
    return 'denied';
  }
}
