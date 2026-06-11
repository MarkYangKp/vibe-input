import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { Device } from '../../../shared/types';

// Settings interface
export interface Settings {
  theme: 'system' | 'light' | 'dark';
  llmEnabled: boolean;
  lastDeviceId?: string;
}

// App state interface
export interface AppState {
  devices: Device[];
  currentDevice: Device | null;
  settings: Settings;
  llmConfigured: boolean;
  toastMessage: string | null;
  toastType: 'success' | 'error' | 'info';
  isLoading: boolean;
}

// Action types
type SetDevicesAction = { type: 'SET_DEVICES'; payload: Device[] };
type AddDeviceAction = { type: 'ADD_DEVICE'; payload: Device };
type RemoveDeviceAction = { type: 'REMOVE_DEVICE'; payload: string };
type UpdateDeviceAction = { type: 'UPDATE_DEVICE'; payload: Device };
type SetCurrentDeviceAction = { type: 'SET_CURRENT_DEVICE'; payload: Device | null };
type UpdateDeviceStatusAction = { type: 'UPDATE_DEVICE_STATUS'; payload: { deviceId: string; isOnline: boolean } };
type SetSettingsAction = { type: 'SET_SETTINGS'; payload: Partial<Settings> };
type SetLlmConfiguredAction = { type: 'SET_LLM_CONFIGURED'; payload: boolean };
type ShowToastAction = { type: 'SHOW_TOAST'; payload: { message: string; type: 'success' | 'error' | 'info' } };
type HideToastAction = { type: 'HIDE_TOAST' };
type SetLoadingAction = { type: 'SET_LOADING'; payload: boolean };

export type AppAction =
  | SetDevicesAction
  | AddDeviceAction
  | RemoveDeviceAction
  | UpdateDeviceAction
  | SetCurrentDeviceAction
  | UpdateDeviceStatusAction
  | SetSettingsAction
  | SetLlmConfiguredAction
  | ShowToastAction
  | HideToastAction
  | SetLoadingAction;

// Initial state
const initialState: AppState = {
  devices: [],
  currentDevice: null,
  settings: {
    theme: 'system',
    llmEnabled: false,
  },
  llmConfigured: false,
  toastMessage: null,
  toastType: 'info',
  isLoading: false,
};

// Pure reducer
export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_DEVICES':
      return { ...state, devices: action.payload };

    case 'ADD_DEVICE': {
      const existingIndex = state.devices.findIndex(
        d => d.ip === action.payload.ip && d.port === action.payload.port
      );
      if (existingIndex >= 0) {
        const updatedDevices = [...state.devices];
        updatedDevices[existingIndex] = {
          ...action.payload,
          lastConnected: Date.now(),
        };
        return { ...state, devices: updatedDevices };
      }
      return {
        ...state,
        devices: [...state.devices, { ...action.payload, lastConnected: Date.now() }],
      };
    }

    case 'REMOVE_DEVICE':
      return {
        ...state,
        devices: state.devices.filter(d => d.id !== action.payload),
        currentDevice: state.currentDevice?.id === action.payload ? null : state.currentDevice,
      };

    case 'UPDATE_DEVICE': {
      const index = state.devices.findIndex(d => d.id === action.payload.id);
      if (index < 0) return state;
      const updatedDevices = [...state.devices];
      updatedDevices[index] = action.payload;
      return {
        ...state,
        devices: updatedDevices,
        currentDevice: state.currentDevice?.id === action.payload.id ? action.payload : state.currentDevice,
      };
    }

    case 'SET_CURRENT_DEVICE':
      return { ...state, currentDevice: action.payload };

    case 'UPDATE_DEVICE_STATUS': {
      const index = state.devices.findIndex(d => d.id === action.payload.deviceId);
      if (index < 0) return state;
      const updatedDevices = [...state.devices];
      updatedDevices[index] = {
        ...updatedDevices[index],
        isOnline: action.payload.isOnline,
        lastConnected: action.payload.isOnline ? Date.now() : updatedDevices[index].lastConnected,
      };
      return { ...state, devices: updatedDevices };
    }

    case 'SET_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };

    case 'SET_LLM_CONFIGURED':
      return { ...state, llmConfigured: action.payload };

    case 'SHOW_TOAST':
      return {
        ...state,
        toastMessage: action.payload.message,
        toastType: action.payload.type,
      };

    case 'HIDE_TOAST':
      return { ...state, toastMessage: null };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    default:
      return state;
  }
}

// Context
interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

// Provider component
interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps): JSX.Element {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

// Hook to use context
export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}