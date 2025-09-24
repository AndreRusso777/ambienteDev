import React, { useState, useEffect, useCallback } from 'react';
import { GetServerSidePropsContext } from 'next';
import { useRouter } from 'next/router';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  CreditCard, 
  FileText, 
  UserIcon, 
  ArrowLeft,
  Loader2,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import AdminLayout from '@/layout/admin';
import { validateSession } from '@/lib/auth';
import { getUser } from '@/actions/user';
import type { AdminNotification } from '@/types/notification';
import type User from '@/types/user';

interface NotificationsPageProps {
  user: User;
  sessionId: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export default function NotificationsPage({ user, sessionId }: NotificationsPageProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0); // Total real de não lidas
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasMore: false
  });

  const fetchNotifications = useCallback(async (page = 1, append = false) => {
    try {
      setError(null); // Limpar erro anterior
      
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await fetch(`/api/notifications/paginated?page=${page}&limit=10`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/');
          return;
        }
        throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        if (append) {
          setNotifications(prev => [...prev, ...data.data.notifications]);
        } else {
          setNotifications(data.data.notifications);
        }
        setPagination(data.data.pagination);
        
        // Atualizar total de não lidas apenas se retornado pela API
        if (typeof data.data.unreadCount === 'number') {
          setTotalUnreadCount(data.data.unreadCount);
        }
      } else {
        throw new Error(data.message || 'Erro ao buscar notificações');
      }
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido ao buscar notificações');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [router]);

  const loadMore = () => {
    if (pagination.hasMore && !loadingMore) {
      fetchNotifications(pagination.page + 1, true);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, is_read: true } : n
          )
        );
        
        // Decrementar contador total de não lidas se a notificação não estava lida
        const notification = notifications.find(n => n.id === notificationId);
        if (notification && !notification.is_read) {
          setTotalUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, is_read: true }))
        );
        // Zerar contador de não lidas
        setTotalUnreadCount(0);
      }
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  const handleNotificationClick = (notification: AdminNotification) => {
    // Marcar como lida se ainda não foi
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    // Navegar baseado no tipo de notificação
    switch (notification.type) {
      case 'document_request':
        if (notification.data?.user_id) {
          router.push(`/admin/user/${notification.data.user_id}`);
        }
        break;
      case 'payment':
        router.push('/admin/payments');
        break;
      case 'user_registration':
        if (notification.data?.user_id) {
          router.push(`/admin/user/${notification.data.user_id}`);
        }
        break;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'document_request':
        return <FileText className="w-5 h-5" />;
      case 'payment':
        return <CreditCard className="w-5 h-5" />;
      case 'user_registration':
        return <UserIcon className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'agora';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m atrás`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h atrás`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d atrás`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}sem atrás`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mês${Math.floor(diffInSeconds / 2592000) !== 1 ? 'es' : ''} atrás`;
    return `${Math.floor(diffInSeconds / 31536000)}ano${Math.floor(diffInSeconds / 31536000) !== 1 ? 's' : ''} atrás`;
  };

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Usar o contador total de não lidas da API em vez do calculado localmente
  const unreadCount = totalUnreadCount;

  return (
    <AdminLayout sessionId={sessionId}>
      <div className="min-h-screen bg-gray-50 md:pt-20 pt-12">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Voltar"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                Notificações
              </h1>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  {/* {pagination.total} notificaç{pagination.total !== 1 ? 'ões' : 'ão'} no total */}
                  {unreadCount > 0 && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                      {unreadCount} não lida{unreadCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </span>
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <CheckCheck className="w-4 h-4" />
                  Marcar todas como lidas
                </button>
              )}
            </div>
          </div>

          {/* Lista de notificações */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {error ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Erro ao carregar notificações
                </h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 max-w-md mx-auto">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
                <button
                  onClick={() => fetchNotifications()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Tentar novamente
                </button>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-3 text-gray-600">Carregando notificações...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma notificação
                </h3>
                <p className="text-gray-600">
                  Você não possui notificações no momento.
                </p>
              </div>
            ) : (
              <>
                {notifications.map((notification, index) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`
                      p-4 border-b border-gray-100 last:border-b-0 transition-colors
                      ${!notification.is_read ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'}
                      ${['document_request', 'payment', 'user_registration'].includes(notification.type) 
                        ? 'cursor-pointer' 
                        : ''
                      }
                    `}
                  >
                    <div className="flex items-start gap-4">
                      {/* Ícone */}
                      <div className={`
                        flex-shrink-0 p-2 rounded-lg
                        ${!notification.is_read ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}
                      `}>
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className={`
                              font-medium text-sm mb-1
                              ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'}
                            `}>
                              {notification.title}
                            </h3>
                            <p className={`
                              text-sm mb-2
                              ${!notification.is_read ? 'text-gray-700' : 'text-gray-600'}
                            `}>
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                              <span>{formatTimeAgo(notification.created_at)}</span>
                              <span className="text-gray-300">•</span>
                              <span>{formatDate(notification.created_at)}</span>
                              {notification.read_by_count !== undefined && (
                              <>
                                <span className="text-gray-300">•</span>
                                <span>
                                Lida por {notification.read_by_count} admin{notification.read_by_count !== 1 ? 's' : ''}
                                </span>
                              </>
                              )}
                            </div>
                          </div>

                          {/* Ações */}
                          <div className="flex items-center gap-2">
                            {['document_request', 'payment', 'user_registration'].includes(notification.type) && (
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            )}
                            
                            {!notification.is_read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                className="p-1 rounded hover:bg-blue-200 text-blue-600"
                                title="Marcar como lida"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Botão carregar mais */}
                {pagination.hasMore && (
                  <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <button
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Carregando...
                        </>
                      ) : (
                        <>
                          Carregar mais ({pagination.total - notifications.length} restantes)
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

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

  const user: User | null = await getUser(session.userId);

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
      sessionId,
    },
  };
}
