export interface UserSetting {
  id: number;
  user_id: number;
  setting_key: string;
  setting_value: any;
  created_at: string;
  updated_at: string;
}

export interface NotificationSettings {
  sound_enabled: boolean;
  sound_volume: number;
  sound_type: 'bell' | 'classic' | 'modern' | 'sweep' | 'pop';
  browser_notifications: boolean;
  email_notifications: boolean;
  notification_types: {
    document_requests: boolean;
    payments: boolean;
    user_registrations: boolean;
    system_updates: boolean;
  };
}

export interface UserSettings {
  notifications: NotificationSettings;
  // Outras configurações podem ser adicionadas aqui no futuro
  theme?: 'light' | 'dark' | 'auto';
  language?: 'pt-BR' | 'en-US' | 'es-ES';
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  sound_enabled: true,
  sound_volume: 0.6,
  sound_type: 'bell',
  browser_notifications: true,
  email_notifications: true,
  notification_types: {
    document_requests: true,
    payments: true,
    user_registrations: true,
    system_updates: true,
  }
};

export const DEFAULT_USER_SETTINGS: UserSettings = {
  notifications: DEFAULT_NOTIFICATION_SETTINGS,
  theme: 'light',
  language: 'pt-BR'
};
