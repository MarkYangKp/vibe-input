import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { App } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';
import { useToast } from './useToast';

export function useBackButton(): void {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const isRootRef = useRef(location.pathname === '/');
  const exitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep ref in sync with current location so the listener always reads the latest value
  isRootRef.current = location.pathname === '/';

  useEffect(() => {
    let cancelled = false;
    let handler: PluginListenerHandle | null = null;

    App.addListener('backButton', () => {
      if (!isRootRef.current) {
        navigate('/');
        return;
      }

      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current);
        exitTimeoutRef.current = null;
        App.exitApp();
      } else {
        showToast('再按一次退出应用', 'info');
        exitTimeoutRef.current = setTimeout(() => {
          exitTimeoutRef.current = null;
        }, 2000);
      }
    }).then(h => {
      if (cancelled) {
        h.remove();
      } else {
        handler = h;
      }
    }).catch(err => {
      console.error('Failed to register back button listener:', err);
      showToast('返回键功能不可用', 'error');
    });

    return () => {
      cancelled = true;
      handler?.remove();
      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current);
      }
    };
  }, []); // Register listener once on mount; current path read via ref — safe to omit deps
}
