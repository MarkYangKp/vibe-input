import { useCallback, useEffect } from 'react';
import { useAppContext } from '../store/AppContext';

import { saveSettings } from '../services/storage';

type Theme = 'system' | 'light' | 'dark';

interface UseThemeReturn {
  theme: Theme;
  setTheme: (theme: Theme) => Promise<void>;
}

export function useTheme(): UseThemeReturn {
  const { state, dispatch } = useAppContext();
  const theme = state.settings.theme;

  const applyTheme = useCallback((newTheme: Theme): void => {
    const html = document.documentElement;

    if (newTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      html.setAttribute('data-theme', systemTheme);
    } else {
      html.setAttribute('data-theme', newTheme);
    }
  }, []);

  const setTheme = useCallback(async (newTheme: Theme): Promise<void> => {
    try {
      await saveSettings({ theme: newTheme });
      dispatch({ type: 'SET_SETTINGS', payload: { theme: newTheme } });
      applyTheme(newTheme);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  }, [dispatch, applyTheme]);

  // Apply theme on mount and when theme changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  // Listen for system theme changes when theme is 'system'
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (): void => {
      applyTheme('system');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, applyTheme]);

  return {
    theme,
    setTheme,
  };
}