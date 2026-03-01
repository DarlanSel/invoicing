import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';
import { DEFAULT_SETTINGS } from '../constants/defaults';

export function useSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getSettings()
      .then(setSettings)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const saveSettings = useCallback(async (updates) => {
    setSettings(prev => ({ ...prev, ...updates }));
    try {
      const updated = await api.saveSettings(updates);
      setSettings(updated);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  return { settings, saveSettings, loading, error };
}
