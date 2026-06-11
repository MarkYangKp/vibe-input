import { useCallback } from 'react';
import { useAppContext } from '../store/AppContext';
import type { Device } from '../../../shared/types';

import { getDevices, addDevice as storageAddDevice, removeDevice as storageRemoveDevice, updateDeviceStatus as storageUpdateDeviceStatus, setLastDevice } from '../services/storage';

import { checkHealth } from '../services/api';

interface UseDevicesReturn {
  devices: Device[];
  currentDevice: Device | null;
  addDevice: (device: Device) => Promise<void>;
  removeDevice: (deviceId: string) => Promise<void>;
  selectDevice: (device: Device | null) => Promise<void>;
  refreshDevices: () => Promise<void>;
  updateDeviceStatus: (deviceId: string, isOnline: boolean) => Promise<void>;
}

export function useDevices(): UseDevicesReturn {
  const { state, dispatch } = useAppContext();

  const addDevice = useCallback(async (device: Device): Promise<void> => {
    try {
      await storageAddDevice(device);
      dispatch({ type: 'ADD_DEVICE', payload: device });
    } catch (error) {
      console.error('Failed to add device:', error);
      throw error;
    }
  }, [dispatch]);

  const removeDevice = useCallback(async (deviceId: string): Promise<void> => {
    try {
      await storageRemoveDevice(deviceId);
      dispatch({ type: 'REMOVE_DEVICE', payload: deviceId });
    } catch (error) {
      console.error('Failed to remove device:', error);
      throw error;
    }
  }, [dispatch]);

  const selectDevice = useCallback(async (device: Device | null): Promise<void> => {
    dispatch({ type: 'SET_CURRENT_DEVICE', payload: device });
    if (device) {
      try {
        await setLastDevice(device.id);
      } catch (error) {
        console.error('Failed to save last device:', error);
      }
    }
  }, [dispatch]);

  const refreshDevices = useCallback(async (): Promise<void> => {
    try {
      const devices = await getDevices();
      dispatch({ type: 'SET_DEVICES', payload: devices });

      // Check health for each device
      for (const device of devices) {
        try {
          const result = await checkHealth(device);
          dispatch({
            type: 'UPDATE_DEVICE_STATUS',
            payload: { deviceId: device.id, isOnline: result.ok },
          });
        } catch {
          dispatch({
            type: 'UPDATE_DEVICE_STATUS',
            payload: { deviceId: device.id, isOnline: false },
          });
        }
      }
    } catch (error) {
      console.error('Failed to refresh devices:', error);
    }
  }, [dispatch]);

  const updateDeviceStatus = useCallback(async (deviceId: string, isOnline: boolean): Promise<void> => {
    try {
      await storageUpdateDeviceStatus(deviceId, isOnline);
      dispatch({ type: 'UPDATE_DEVICE_STATUS', payload: { deviceId, isOnline } });
    } catch (error) {
      console.error('Failed to update device status:', error);
    }
  }, [dispatch]);

  return {
    devices: state.devices,
    currentDevice: state.currentDevice,
    addDevice,
    removeDevice,
    selectDevice,
    refreshDevices,
    updateDeviceStatus,
  };
}