import { Capacitor, registerPlugin } from '@capacitor/core';

interface DeviceSettingsPlugin {
  promptEnableLocation(): Promise<{ resolved: boolean; alreadyEnabled?: boolean }>;
  openLocationSettings(): Promise<{ opened: boolean }>;
  openAppSettings(): Promise<{ opened: boolean }>;
}

const DeviceSettings = registerPlugin<DeviceSettingsPlugin>('DeviceSettings');

export async function promptEnableDeviceLocation(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }

  try {
    const result = await DeviceSettings.promptEnableLocation();
    return Boolean(result?.resolved);
  } catch (error) {
    console.warn('[nativeSettingsService] Unable to show Android Location enable dialog:', error);
    return false;
  }
}

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
