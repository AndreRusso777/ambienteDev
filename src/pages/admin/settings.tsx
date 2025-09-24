import React, { useState } from 'react';
import { Bell, User, Palette, Globe, Users } from 'lucide-react';
import AdminLayout from '@/layout/admin';
import { useUser } from '@/context/user';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useSuperAdminInfo } from '@/hooks/useSuperAdmin';
import NotificationSettingsTab from '@/components/admin/settings/notification-settings-tab';
import UserManagementTab from '@/components/admin/settings/user-management-tab';
import type { NotificationSettings } from '@/types/settings';
import { validateSession } from '@/lib/auth';
import { getUser } from '@/actions/user';
import { GetServerSidePropsContext } from 'next';
import UserType from '@/types/user';

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { auth_session: sessionId } = context.req.cookies;
  const { session } = await validateSession(sessionId);

  if (!session) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  let user: UserType | null = await getUser(session.userId);

  if (user?.role !== 'admin') {
    return {
      redirect: {
        destination: "/dashboard",
        permanent: false,
      },
    };
  }

  return {
    props: { 
      user, 
      sessionId: session.id 
    },
  };
}

const tabs = [
  {
    id: 'notifications',
    label: 'Notificações',
    icon: Bell,
    description: 'Configurar alertas e sons'
  },
  {
    id: 'users',
    label: 'Gerenciar Usuários',
    icon: Users,
    description: 'Administrar usuários do sistema'
  },
  // {
  //   id: 'profile',
  //   label: 'Perfil',
  //   icon: User,
  //   description: 'Informações pessoais'
  // },
  // {
  //   id: 'appearance',
  //   label: 'Aparência',
  //   icon: Palette,
  //   description: 'Tema e layout'
  // },
  // {
  //   id: 'general',
  //   label: 'Geral',
  //   icon: Globe,
  //   description: 'Idioma e região'
  // }
];

export default function SettingsPage({ user: serverUser, sessionId }: { 
  user: UserType, 
  sessionId: string 
}) {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('notifications');
  const { settings, loading, error, updateNotificationSettings } = useUserSettings();
  const { isSuperAdmin } = useSuperAdminInfo();
  const currentUser = user || serverUser;

  const availableTabs = tabs.filter(tab => {
    if (tab.id === 'users') {
      return isSuperAdmin;
    }
    return true;
  });

  const handleNotificationSettingsChange = async (notificationSettings: NotificationSettings) => {
    const success = await updateNotificationSettings(notificationSettings);
    if (success) {
      // Feedback de sucesso
      console.log('Configurações salvas com sucesso!');
    }
  };

  // Redirect se não for admin (fallback)
  if (currentUser && currentUser.role !== 'admin') {
    return (
      <AdminLayout sessionId={sessionId}>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
            <p className="text-gray-600">Apenas administradores podem acessar esta página.</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout sessionId={sessionId}>
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <div className="mt-6 mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Configurações</h1>
            <p className="text-gray-600">
              Gerencie suas preferências e configurações da conta
            </p>
          </div>

          {/* Erro */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Erro ao carregar configurações
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    {error}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar de Navegação */}
            <div className="lg:w-64 flex-shrink-0">
              <nav className="bg-white rounded-lg border border-gray-200 p-4">
                <ul className="space-y-2">
                  {availableTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    
                    return (
                      <li key={tab.id}>
                        <button
                          onClick={() => setActiveTab(tab.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${
                            isActive
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                          <div>
                            <div className="font-medium">{tab.label}</div>
                            <div className="text-xs text-gray-500">{tab.description}</div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </div>

            {/* Conteúdo Principal */}
            <div className="flex-1">
              {loading ? (
                <div className="bg-white rounded-lg border border-gray-200 p-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Carregando configurações...</span>
                  </div>
                </div>
              ) : (
                <>
                  {/* Aba de Notificações */}
                  {activeTab === 'notifications' && settings && (
                    <NotificationSettingsTab
                      settings={settings.notifications}
                      onSettingsChange={handleNotificationSettingsChange}
                      loading={loading}
                    />
                  )}

                  {/* Aba de Gerenciamento de Usuários */}
                  {activeTab === 'users' && isSuperAdmin && (
                    <UserManagementTab
                      onRefresh={() => {
                        console.log('Usuários atualizados');
                      }}
                    />
                  )}

                  {/* Mensagem de acesso negado para não super admins */}
                  {activeTab === 'users' && !isSuperAdmin && (
                    <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                      <div className="text-red-400 mb-4">
                        <Users className="h-16 w-16 mx-auto" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Acesso Restrito
                      </h3>
                      <p className="text-gray-600">
                        Apenas super administradores podem gerenciar usuários.
                      </p>
                    </div>
                  )}

                  {/* Outras abas (placeholder) */}
                  {!['notifications', 'users'].includes(activeTab) && (
                    <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                      <div className="text-gray-400 mb-4">
                        <Globe className="h-16 w-16 mx-auto" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {availableTabs.find(t => t.id === activeTab)?.label}
                      </h3>
                      <p className="text-gray-600">
                        Esta seção estará disponível em breve.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
