import { describe, it, expect } from 'vitest';
import { appReducer, type AppState, type AppAction } from './AppContext';

const initialState: AppState = {
  devices: [],
  currentDevice: null,
  settings: { theme: 'system', llmEnabled: false },
  llmConfigured: false,
  toastMessage: null,
  toastType: 'info',
  isLoading: false,
};

const mockDevice = {
  id: 'device_1',
  name: 'Test Device',
  ip: '192.168.1.100',
  port: 3900,
  lastConnected: Date.now(),
  isOnline: true,
};

describe('appReducer', () => {
  it('SET_DEVICES replaces devices', () => {
    const action: AppAction = { type: 'SET_DEVICES', payload: [mockDevice] };
    const state = appReducer(initialState, action);
    expect(state.devices).toEqual([mockDevice]);
  });

  it('ADD_DEVICE adds new device', () => {
    const action: AppAction = { type: 'ADD_DEVICE', payload: mockDevice };
    const state = appReducer(initialState, action);
    expect(state.devices).toHaveLength(1);
    expect(state.devices[0].id).toBe('device_1');
  });

  it('ADD_DEVICE updates existing device by IP+port', () => {
    const stateWithDevice = { ...initialState, devices: [mockDevice] };
    const updatedDevice = { ...mockDevice, name: 'Updated Name' };
    const action: AppAction = { type: 'ADD_DEVICE', payload: updatedDevice };
    const state = appReducer(stateWithDevice, action);
    expect(state.devices).toHaveLength(1);
    expect(state.devices[0].name).toBe('Updated Name');
  });

  it('REMOVE_DEVICE removes device by id', () => {
    const stateWithDevice = { ...initialState, devices: [mockDevice] };
    const action: AppAction = { type: 'REMOVE_DEVICE', payload: 'device_1' };
    const state = appReducer(stateWithDevice, action);
    expect(state.devices).toHaveLength(0);
  });

  it('REMOVE_DEVICE clears currentDevice if removed', () => {
    const stateWithCurrent = {
      ...initialState,
      devices: [mockDevice],
      currentDevice: mockDevice,
    };
    const action: AppAction = { type: 'REMOVE_DEVICE', payload: 'device_1' };
    const state = appReducer(stateWithCurrent, action);
    expect(state.currentDevice).toBeNull();
  });

  it('SET_CURRENT_DEVICE sets current device', () => {
    const action: AppAction = { type: 'SET_CURRENT_DEVICE', payload: mockDevice };
    const state = appReducer(initialState, action);
    expect(state.currentDevice).toEqual(mockDevice);
  });

  it('SET_CURRENT_DEVICE with null clears current device', () => {
    const stateWithCurrent = { ...initialState, currentDevice: mockDevice };
    const action: AppAction = { type: 'SET_CURRENT_DEVICE', payload: null };
    const state = appReducer(stateWithCurrent, action);
    expect(state.currentDevice).toBeNull();
  });

  it('UPDATE_DEVICE_STATUS updates device online status', () => {
    const stateWithDevice = { ...initialState, devices: [mockDevice] };
    const action: AppAction = {
      type: 'UPDATE_DEVICE_STATUS',
      payload: { deviceId: 'device_1', isOnline: false },
    };
    const state = appReducer(stateWithDevice, action);
    expect(state.devices[0].isOnline).toBe(false);
  });

  it('SET_SETTINGS merges settings', () => {
    const action: AppAction = { type: 'SET_SETTINGS', payload: { theme: 'dark' } };
    const state = appReducer(initialState, action);
    expect(state.settings.theme).toBe('dark');
    expect(state.settings.llmEnabled).toBe(false);
  });

  it('SET_LLM_CONFIGURED sets llmConfigured', () => {
    const action: AppAction = { type: 'SET_LLM_CONFIGURED', payload: true };
    const state = appReducer(initialState, action);
    expect(state.llmConfigured).toBe(true);
  });

  it('SHOW_TOAST sets toast message and type', () => {
    const action: AppAction = {
      type: 'SHOW_TOAST',
      payload: { message: 'Test message', type: 'success' },
    };
    const state = appReducer(initialState, action);
    expect(state.toastMessage).toBe('Test message');
    expect(state.toastType).toBe('success');
  });

  it('HIDE_TOAST clears toast message', () => {
    const stateWithToast = {
      ...initialState,
      toastMessage: 'Test',
      toastType: 'error' as const,
    };
    const action: AppAction = { type: 'HIDE_TOAST' };
    const state = appReducer(stateWithToast, action);
    expect(state.toastMessage).toBeNull();
  });

  it('SET_LOADING sets loading state', () => {
    const action: AppAction = { type: 'SET_LOADING', payload: true };
    const state = appReducer(initialState, action);
    expect(state.isLoading).toBe(true);
  });

  it('returns current state for unknown action', () => {
    const action = { type: 'UNKNOWN' } as unknown as AppAction;
    const state = appReducer(initialState, action);
    expect(state).toBe(initialState);
  });
});
