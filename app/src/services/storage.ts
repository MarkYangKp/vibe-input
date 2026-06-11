import { Preferences } from '@capacitor/preferences';
import type { Device } from '../../../shared/types';

const DEVICES_KEY = 'vibe-input-devices';
const SETTINGS_KEY = 'vibe-input-settings';

export interface Settings {
  theme: 'system' | 'light' | 'dark';
  llmEnabled: boolean;
  lastDeviceId?: string;
}

const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  llmEnabled: false,
};

function isDeviceArray(data: unknown): data is Device[] {
  return Array.isArray(data) && data.every(
    d => typeof d === 'object' && d !== null &&
      typeof (d as Device).id === 'string' &&
      typeof (d as Device).ip === 'string'
  );
}

export async function getDevices(): Promise<Device[]> {
  try {
    const { value } = await Preferences.get({ key: DEVICES_KEY });
    if (value) {
      const parsed: unknown = JSON.parse(value);
      if (isDeviceArray(parsed)) {
        return parsed;
      }
    }
  } catch {
    // Corrupted data or parse error — return empty list
  }
  return [];
}

export async function saveDevices(devices: Device[]): Promise<void> {
  try {
    await Preferences.set({
      key: DEVICES_KEY,
      value: JSON.stringify(devices),
    });
  } catch (error) {
    console.error('Failed to save devices:', error);
    throw error;
  }
}

export async function addDevice(device: Device): Promise<Device[]> {
  const devices = await getDevices();
  const existingIndex = devices.findIndex(d => d.ip === device.ip && d.port === device.port);
  
  let updatedDevices: Device[];
  if (existingIndex >= 0) {
    updatedDevices = devices.map((d, i) => 
      i === existingIndex 
        ? { ...device, lastConnected: Date.now() }
        : d
    );
  } else {
    updatedDevices = [...devices, { ...device, lastConnected: Date.now() }];
  }
  
  await saveDevices(updatedDevices);
  return updatedDevices;
}

export async function removeDevice(deviceId: string): Promise<Device[]> {
  const devices = await getDevices();
  const filtered = devices.filter(d => d.id !== deviceId);
  await saveDevices(filtered);
  return filtered;
}

export async function updateDeviceStatus(deviceId: string, isOnline: boolean): Promise<Device[]> {
  const devices = await getDevices();
  const updatedDevices = devices.map(d => 
    d.id === deviceId 
      ? { 
          ...d, 
          isOnline, 
          lastConnected: isOnline ? Date.now() : d.lastConnected 
        }
      : d
  );
  await saveDevices(updatedDevices);
  return updatedDevices;
}

export async function getSettings(): Promise<Settings> {
  try {
    const { value } = await Preferences.get({ key: SETTINGS_KEY });
    if (value) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(value) };
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
  return DEFAULT_SETTINGS;
}

export async function saveSettings(settings: Partial<Settings>): Promise<Settings> {
  const current = await getSettings();
  const updated = { ...current, ...settings };
  
  try {
    await Preferences.set({
      key: SETTINGS_KEY,
      value: JSON.stringify(updated),
    });
  } catch (error) {
    console.error('Failed to save settings:', error);
    throw error;
  }
  
  return updated;
}

export async function getLastDevice(): Promise<Device | null> {
  const settings = await getSettings();
  if (settings.lastDeviceId) {
    const devices = await getDevices();
    return devices.find(d => d.id === settings.lastDeviceId) || null;
  }
  return null;
}

export async function setLastDevice(deviceId: string): Promise<void> {
  await saveSettings({ lastDeviceId: deviceId });
}
