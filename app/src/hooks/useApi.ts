import { useCallback, useState } from 'react';
import { useAppContext } from '../store/AppContext';
import type { Device } from '../../../shared/types';

import { sendText as apiSendText, polishText as apiPolishText, checkHealth as apiCheckHealth, getConfig as apiGetConfig, testConnection as apiTestConnection } from '../services/api';

interface UseApiReturn {
  sendText: (device: Device, text: string) => Promise<{ ok: boolean; error?: string }>;
  polishText: (device: Device, text: string) => Promise<{ ok: boolean; text?: string; error?: string }>;
  checkHealth: (device: Device) => Promise<{ ok: boolean; error?: string }>;
  getConfig: (device: Device) => Promise<{ ok: boolean; data?: { llm: { configured: boolean } }; error?: string }>;
  testConnection: (device: Device) => Promise<{ ok: boolean; error?: string }>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useApi(): UseApiReturn {
  const { dispatch } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const sendText = useCallback(async (device: Device, text: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiSendText(device, text);
      if (!result.ok) {
        setError(result.error || '发送失败');
        dispatch({
          type: 'SHOW_TOAST',
          payload: { message: result.error || '发送失败', type: 'error' },
        });
      } else {
        dispatch({
          type: 'SHOW_TOAST',
          payload: { message: '已发送到电脑', type: 'success' },
        });
      }
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : '发送失败';
      setError(message);
      dispatch({
        type: 'SHOW_TOAST',
        payload: { message, type: 'error' },
      });
      return { ok: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  const polishText = useCallback(async (device: Device, text: string) => {
    setIsLoading(true);
    setError(null);
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const result = await apiPolishText(device, text);
      if (!result.ok) {
        setError(result.error || '整理失败');
        dispatch({
          type: 'SHOW_TOAST',
          payload: { message: result.error || '整理失败', type: 'error' },
        });
      }
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : '整理失败';
      setError(message);
      dispatch({
        type: 'SHOW_TOAST',
        payload: { message, type: 'error' },
      });
      return { ok: false, error: message };
    } finally {
      setIsLoading(false);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [dispatch]);

  const checkHealth = useCallback(async (device: Device) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiCheckHealth(device);
      if (!result.ok) {
        setError(result.error || '连接失败');
      }
      return { ok: result.ok, error: result.error };
    } catch (err) {
      const message = err instanceof Error ? err.message : '连接失败';
      setError(message);
      return { ok: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getConfig = useCallback(async (device: Device) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiGetConfig(device);
      if (!result.ok) {
        setError(result.error || '获取配置失败');
      }
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取配置失败';
      setError(message);
      return { ok: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const testConnection = useCallback(async (device: Device) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiTestConnection(device);
      if (!result.ok) {
        setError(result.error || '连接失败');
        dispatch({
          type: 'SHOW_TOAST',
          payload: { message: result.error || '连接失败', type: 'error' },
        });
      }
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : '连接失败';
      setError(message);
      dispatch({
        type: 'SHOW_TOAST',
        payload: { message, type: 'error' },
      });
      return { ok: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  return {
    sendText,
    polishText,
    checkHealth,
    getConfig,
    testConnection,
    isLoading,
    error,
    clearError,
  };
}
