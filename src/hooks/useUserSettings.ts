import { useState, useEffect, useCallback } from 'react';
import type { UserSettings, NotificationSettings } from '@/types/settings';

interface UseUserSettingsReturn {
  settings: UserSettings | null;
  loading: boolean;
  error: string | null;
  updateSetting: (key: string, value: any) => Promise<boolean>;
  updateNotificationSettings: (notifications: NotificationSettings) => Promise<boolean>;
}

export function useUserSettings(): UseUserSettingsReturn {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/settings', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setSettings(data.data);
      } else {
        throw new Error(data.message || 'Erro ao carregar configurações');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSetting = useCallback(async (key: string, value: any): Promise<boolean> => {
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          setting_key: key,
          setting_value: value
        })
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setSettings(prev => prev ? { ...prev, [key]: value } : null);
        return true;
      } else {
        throw new Error(data.message || 'Erro ao atualizar configuração');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      return false;
    }
  }, []);

  const updateNotificationSettings = useCallback(async (notifications: NotificationSettings): Promise<boolean> => {
    return updateSetting('notifications', notifications);
  }, [updateSetting]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    loading,
    error,
    updateSetting,
    updateNotificationSettings
  };
}
