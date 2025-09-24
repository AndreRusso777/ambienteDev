import React, { createContext, useContext, useState, useCallback } from 'react';

export interface ToastSettings {
  enabled: boolean;
  showForDocumentRequests: boolean;
  showForPayments: boolean;
  showForUserRegistrations: boolean;
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  autoClose: number;
  showProgress: boolean;
  pauseOnHover: boolean;
  theme: 'light' | 'dark' | 'colored';
}

interface ToastSettingsContextType {
  settings: ToastSettings;
  updateSettings: (newSettings: Partial<ToastSettings>) => void;
  resetSettings: () => void;
}

const defaultSettings: ToastSettings = {
  enabled: true,
  showForDocumentRequests: true,
  showForPayments: true,
  showForUserRegistrations: true,
  position: 'top-right',
  autoClose: 5000,
  showProgress: true,
  pauseOnHover: true,
  theme: 'light',
};

const ToastSettingsContext = createContext<ToastSettingsContextType | undefined>(undefined);

interface ToastSettingsProviderProps {
  children: React.ReactNode;
}

export const ToastSettingsProvider: React.FC<ToastSettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<ToastSettings>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedSettings = localStorage.getItem('dr-gorila-toast-settings');
        if (savedSettings) {
          return { ...defaultSettings, ...JSON.parse(savedSettings) };
        }
      } catch (error) {
        console.warn('Erro ao carregar configurações de toast do localStorage:', error);
      }
    }
    return defaultSettings;
  });

  const updateSettings = useCallback((newSettings: Partial<ToastSettings>) => {
    setSettings(prevSettings => {
      const updatedSettings = { ...prevSettings, ...newSettings };
      
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('dr-gorila-toast-settings', JSON.stringify(updatedSettings));
        } catch (error) {
          console.warn('Erro ao salvar configurações de toast no localStorage:', error);
        }
      }
      
      return updatedSettings;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
    
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('dr-gorila-toast-settings');
      } catch (error) {
        console.warn('Erro ao limpar configurações de toast do localStorage:', error);
      }
    }
  }, []);

  return (
    <ToastSettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </ToastSettingsContext.Provider>
  );
};

export const useToastSettings = (): ToastSettingsContextType => {
  const context = useContext(ToastSettingsContext);
  if (!context) {
    throw new Error('useToastSettings deve ser usado dentro de um ToastSettingsProvider');
  }
  return context;
};
