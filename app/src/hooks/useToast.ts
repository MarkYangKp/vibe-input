import { useCallback, useEffect } from 'react';
import { useAppContext } from '../store/AppContext';

interface Toast {
  message: string;
  type: 'success' | 'error' | 'info';
}

interface UseToastReturn {
  toast: Toast | null;
  showToast: (message: string, type?: Toast['type']) => void;
  hideToast: () => void;
}

export function useToast(): UseToastReturn {
  const { state, dispatch } = useAppContext();

  const toast: Toast | null = state.toastMessage
    ? { message: state.toastMessage, type: state.toastType }
    : null;

  const hideToast = useCallback(() => {
    dispatch({ type: 'HIDE_TOAST' });
  }, [dispatch]);

  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    dispatch({ type: 'SHOW_TOAST', payload: { message, type } });
  }, [dispatch]);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (!state.toastMessage) return;

    const timer = setTimeout(() => {
      dispatch({ type: 'HIDE_TOAST' });
    }, 3000);

    return () => clearTimeout(timer);
  }, [state.toastMessage, dispatch]);

  return {
    toast,
    showToast,
    hideToast,
  };
}