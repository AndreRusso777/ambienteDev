import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Bell, Mail, FileText, CreditCard, UserIcon, Monitor, Play, ChevronDown, Music } from 'lucide-react';
import type { NotificationSettings } from '@/types/settings';
import { playTestSound, type NotificationSoundType, SOUND_TYPE_LABELS } from '@/hooks/useNotificationSound';

interface NotificationSettingsTabProps {
  settings: NotificationSettings;
  onSettingsChange: (settings: NotificationSettings) => void;
  loading?: boolean;
}

export default function NotificationSettingsTab({ 
  settings, 
  onSettingsChange, 
  loading = false 
}: NotificationSettingsTabProps) {
  const [localSettings, setLocalSettings] = useState(settings);
  const [hasChanges, setHasChanges] = useState(false);
  const [soundDropdownOpen, setSoundDropdownOpen] = useState(false);

  const soundTypeOptions: Array<{ value: NotificationSoundType; label: string; description: string }> = [
    { value: 'bell', label: SOUND_TYPE_LABELS.bell, description: 'Som de campainha clássica' },
    { value: 'classic', label: SOUND_TYPE_LABELS.classic, description: 'Som tradicional de notificação' },
    { value: 'modern', label: SOUND_TYPE_LABELS.modern, description: 'Som moderno e elegante' },
    { value: 'sweep', label: SOUND_TYPE_LABELS.sweep, description: 'Som com efeito sweep' },
    { value: 'pop', label: SOUND_TYPE_LABELS.pop, description: 'Som pop curto e discreto' }
  ];

  useEffect(() => {
    setLocalSettings(settings);
    setHasChanges(false);
  }, [settings]);

  useEffect(() => {
    const changed = JSON.stringify(localSettings) !== JSON.stringify(settings);
    setHasChanges(changed);
  }, [localSettings, settings]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (soundDropdownOpen && !target.closest('.sound-dropdown')) {
        setSoundDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [soundDropdownOpen]);

  const handleSettingChange = (key: keyof NotificationSettings, value: any) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
  };

  const handleNotificationTypeChange = (type: keyof NotificationSettings['notification_types'], enabled: boolean) => {
    const newSettings = {
      ...localSettings,
      notification_types: {
        ...localSettings.notification_types,
        [type]: enabled
      }
    };
    setLocalSettings(newSettings);
  };

  const handleSave = () => {
    onSettingsChange(localSettings);
  };

  const handleTestSound = async () => {
    if (localSettings.sound_enabled) {
      await playTestSound(localSettings.sound_type || 'bell', localSettings.sound_volume || 0.5);
    }
  };

  const handleTestSoundType = async (soundType: NotificationSoundType) => {
    try {
      await playTestSound(soundType, localSettings.sound_volume || 0.5);
    } catch (error) {
      console.error('Erro ao testar som:', error);
    }
  };

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(event.target.value);
    handleSettingChange('sound_volume', volume);
  };

  return (
    <div className="space-y-6">
      {/* Configurações de Som */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Volume2 className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Som de Notificação</h3>
        </div>

        <div className="space-y-4">
          {/* Ativar/Desativar Som */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Reproduzir som nas notificações
              </label>
              <p className="text-xs text-gray-500">
                Som será reproduzido quando receber novas notificações
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.sound_enabled}
                onChange={(e) => handleSettingChange('sound_enabled', e.target.checked)}
                className="sr-only peer"
                disabled={loading}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Volume */}
          {localSettings.sound_enabled && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Volume
                </label>
                <button
                  onClick={handleTestSound}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  disabled={loading}
                >
                  <Music className="w-4 h-4 text-gray-400" />
                  Testar som
                </button>
              </div>
              <div className="flex items-center gap-3">
                <VolumeX className="h-4 w-4 text-gray-400" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={localSettings.sound_volume}
                  onChange={handleVolumeChange}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  disabled={loading}
                />
                <Volume2 className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600 min-w-[3rem]">
                  {Math.round(localSettings.sound_volume * 100)}%
                </span>
              </div>
            </div>
          )}

          {/* Tipo de Som - Lista Seletora Customizada */}
          {localSettings.sound_enabled && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Tipo de som
              </label>
              <div className="relative sound-dropdown">
                <button
                  type="button"
                  onClick={() => setSoundDropdownOpen(!soundDropdownOpen)}
                  className="relative w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                >
                  <span className="block truncate">
                    {soundTypeOptions.find(option => option.value === localSettings.sound_type)?.label || 'Selecione um som'}
                  </span>
                  <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  </span>
                </button>

                {soundDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
                    {soundTypeOptions.map((option) => (
                      <div
                        key={option.value}
                        onClick={() => {
                          handleSettingChange('sound_type', option.value);
                          setSoundDropdownOpen(false);
                        }}
                        className={`cursor-pointer select-none relative py-2 pl-3 pr-4 hover:bg-gray-50 ${
                          localSettings.sound_type === option.value ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className={`block truncate ${
                              localSettings.sound_type === option.value ? 'font-semibold' : 'font-normal'
                            }`}>
                              {option.label}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!loading) {
                                handleTestSoundType(option.value);
                              }
                            }}
                            className="ml-2 p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded"
                            disabled={loading}
                            title="Ouvir este som"
                          >
                            <Play className="h-4 w-4" />
                          </button>
                        </div>
                        
                        {localSettings.sound_type === option.value && (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-1 text-blue-600">
                            <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Configurações de Notificações do Navegador */}
      {/* <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Notificações do Navegador</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Notificações do navegador
              </label>
              <p className="text-xs text-gray-500">
                Mostrar notificações mesmo quando a aba não estiver ativa
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.browser_notifications}
                onChange={(e) => handleSettingChange('browser_notifications', e.target.checked)}
                className="sr-only peer"
                disabled={loading}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div> */}

      {/* Configurações de Email */}
      {/* {(userRole === 'admin' || process.env.ADMIN_EMAIL === userEmail) && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="h-5 w-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">Notificações por Email</h3>
          </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Receber emails de notificação
              </label>
              <p className="text-xs text-gray-500">
                Receber resumos e notificações importantes por email
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.email_notifications}
                onChange={(e) => handleSettingChange('email_notifications', e.target.checked)}
                className="sr-only peer"
                disabled={loading}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          {userEmail && (
            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
              📧 Email: {userEmail}
            </div>
          )}
        </div>
      </div>)} */}

      {/* Tipos de Notificação */}
      {/* <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Monitor className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Tipos de Notificação</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-blue-600" />
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Solicitações de documentos
                </label>
                <p className="text-xs text-gray-500">
                  Novas solicitações e atualizações de documentos
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.notification_types.document_requests}
                onChange={(e) => handleNotificationTypeChange('document_requests', e.target.checked)}
                className="sr-only peer"
                disabled={loading}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="h-4 w-4 text-green-600" />
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Pagamentos
                </label>
                <p className="text-xs text-gray-500">
                  Confirmações e pendências de pagamento
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.notification_types.payments}
                onChange={(e) => handleNotificationTypeChange('payments', e.target.checked)}
                className="sr-only peer"
                disabled={loading}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserIcon className="h-4 w-4 text-purple-600" />
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Cadastros de usuários
                </label>
                <p className="text-xs text-gray-500">
                  Novos usuários e atualizações de perfil
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.notification_types.user_registrations}
                onChange={(e) => handleNotificationTypeChange('user_registrations', e.target.checked)}
                className="sr-only peer"
                disabled={loading}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Monitor className="h-4 w-4 text-orange-600" />
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Atualizações do sistema
                </label>
                <p className="text-xs text-gray-500">
                  Manutenções e novidades da plataforma
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.notification_types.system_updates}
                onChange={(e) => handleNotificationTypeChange('system_updates', e.target.checked)}
                className="sr-only peer"
                disabled={loading}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div> */}

      {/* Botões de Ação */}
      {hasChanges && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-blue-900">
                Alterações não salvas
              </h4>
              <p className="text-xs text-blue-700">
                Você tem alterações que ainda não foram salvas.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setLocalSettings(settings);
                  setHasChanges(false);
                }}
                className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
