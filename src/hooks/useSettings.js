import { useState, useCallback } from 'react';
import { getItem, setItem } from '../utils/storage';
import { DEFAULT_SETTINGS } from '../constants/defaults';

const KEY = 'invoicing_settings';

export function useSettings() {
  const [settings, setSettingsState] = useState(() => ({
    ...DEFAULT_SETTINGS,
    ...getItem(KEY, {}),
  }));

  const saveSettings = useCallback((updates) => {
    setSettingsState(prev => {
      const next = { ...prev, ...updates };
      setItem(KEY, next);
      return next;
    });
  }, []);

  return { settings, saveSettings };
}
