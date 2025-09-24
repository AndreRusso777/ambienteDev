import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, Check, CheckCheck, CreditCard, FileText, UserIcon, X } from 'lucide-react';
import { useRouter } from 'next/router';
import type { AdminNotification } from '@/types/notification';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useToast } from '@/hooks/useToast';

interface NotificationDropdownProps {
  userRole: string;
}

export default function NotificationDropdown({ userRole }: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const prevUnreadCountRef = useRef(0);
  const isInitialLoadRef = useRef(true);
  const hasUserInteractedRef = useRef(false);
  const processedNotificationIdsRef = useRef(new Set<number>());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  const { settings } = useUserSettings();
  const { showNotificationToast } = useToast();
  
  const { playNotificationSound, cleanup } = useNotificationSound({
    volume: settings?.notifications?.sound_volume || 0.5,
    enabled: true,
    soundType: settings?.notifications?.sound_type || 'bell'
  });

  const playNotificationSoundIfEnabled = useCallback(() => {
    let soundEnabled = true;
    
    if (settings && settings.notifications && typeof settings.notifications.sound_enabled === 'boolean') {
      soundEnabled = settings.notifications.sound_enabled;
    }
    
    if (soundEnabled) {
      try {
        playNotificationSound();
      } catch {
        console.warn('Som de notificação não pôde ser reproduzido.');
      }
    }
  }, [playNotificationSound, settings]);
  
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const fetchNotifications = async (pageNumber: number = 1, reset: boolean = false) => {
    try {
      if (pageNumber > 1) setLoadingMore(true);
      
      const response = await fetch(`/api/notifications/paginated?page=${pageNumber}&limit=10`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          return;
        }
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        const newNotifications = data.data.notifications;
        const newUnreadCount = data.data.unreadCount;
        const pagination = data.data.pagination;

        // Detectar novas notificações ANTES de atualizar o estado (apenas na primeira página)
        let newNotificationItems: AdminNotification[] = [];
        
        if (!isInitialLoadRef.current && pageNumber === 1) {
          // Filtrar apenas notificações que ainda não foram processadas para toast
          newNotificationItems = newNotifications.filter((n: AdminNotification) => 
            !n.is_read && 
            !processedNotificationIdsRef.current.has(n.id) &&
            // Verificar se é realmente uma notificação nova (criada nos últimos 30 segundos)
            new Date(n.created_at).getTime() > Date.now() - (30 * 1000)
          );
        }

        // Atualizar estado
        if (reset || pageNumber === 1) {
          setNotifications(newNotifications);
        } else {
          setNotifications(prev => [...prev, ...newNotifications]);
        }
        
        setUnreadCount(newUnreadCount);
        setHasMore(pagination.hasMore);
        
        // Mostrar toasts apenas para notificações realmente novas (apenas na primeira página)
        if (newNotificationItems.length > 0 && !isInitialLoadRef.current && pageNumber === 1) {
          newNotificationItems.forEach((notification: AdminNotification) => {
            const notificationId = notification.id;
            // Marcar como processada ANTES de exibir o toast
            processedNotificationIdsRef.current.add(notification.id);
            
            // Preparar detalhes baseados no tipo de notificação
            let notificationType: 'document_request' | 'payment' | 'user_registration' | 'default' = 'default';
            let details = '';
            let actionText = '';
            let onAction: (() => void) | undefined;

            switch (notification.type) {
              case 'document_request':
                notificationType = 'document_request';
                details = notification.message || 'Nova solicitação de documento aguardando aprovação';
                actionText = 'Ver perfil';
                onAction = () => {
                  if (notification.data?.user_id) {
                    router.push(`/admin/user/${notification.data.user_id}`);
                  }
                };
                break;
              default:
                notificationType = 'default';
                details = notification.message || '';
            }

            showNotificationToast(notification.title, {
              notificationType,
              notificationId,
              details,
              actionText,
              onAction,
              autoClose: 5000,
              showTimestamp: true
            });
          });

          setTimeout(() => {
            playNotificationSoundIfEnabled();
          }, 200);
        }

        prevUnreadCountRef.current = newUnreadCount;

        if (isInitialLoadRef.current) {
          isInitialLoadRef.current = false;
        }
      }
    } catch {
      console.error('Erro ao buscar notificações.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreNotifications = useCallback(async () => {
    if (loadingMore || !hasMore) {
      return;
    }

    const nextPage = page + 1;
    setPage(nextPage);
    await fetchNotifications(nextPage, false);
  }, [loadingMore, hasMore, page]);

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
        const data = await response.json();
        if (data.success) {
          setNotifications(prev => 
            prev.map(n => 
              n.id === notificationId ? { ...n, is_read: true } : n
            )
          );
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch { }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST'
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, is_read: true }))
        );
        setUnreadCount(0);
      }
    } catch { }
  };

  useEffect(() => {
    if (userRole === 'admin') {
      fetchNotifications(1, true);

      const shouldPoll = settings?.notifications?.browser_notifications !== false;
      if (shouldPoll) {
        const interval = setInterval(() => fetchNotifications(1, true), 30000); // 30 seconds
        return () => clearInterval(interval);
      }
    }
  }, [userRole, settings?.notifications?.browser_notifications]);

  useEffect(() => {
    prevUnreadCountRef.current = unreadCount;
  }, []);

  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      
      const recentNotificationIds = new Set(
        notifications
          .filter(n => new Date(n.created_at).getTime() > fiveMinutesAgo)
          .map(n => n.id)
      );
      
      const currentProcessedIds = processedNotificationIdsRef.current;
      processedNotificationIdsRef.current = new Set(
        Array.from(currentProcessedIds).filter(id => recentNotificationIds.has(id))
      );
    }, 5 * 60 * 1000);

    return () => clearInterval(cleanupInterval);
  }, [notifications]);

  useEffect(() => {
    if (!isOpen || !loadMoreTriggerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !loadingMore) {
          loadMoreNotifications();
        }
      },
      {
        root: scrollContainerRef.current,
        rootMargin: '20px',
        threshold: 0.1
      }
    );

    observer.observe(loadMoreTriggerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loadingMore, isOpen, loadMoreNotifications]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer || !isOpen) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const threshold = 50;
      
      if (scrollHeight - scrollTop - clientHeight < threshold && hasMore && !loadingMore) {
        loadMoreNotifications();
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [hasMore, loadingMore, isOpen, loadMoreNotifications]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'agora';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'document_request':
        return <FileText />;
      default:
        return <Bell />;
    }
  };

  const handleMarkAsRead = (notificationId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    hasUserInteractedRef.current = true;
    markAsRead(notificationId);
  };

  const handleMarkAllAsRead = () => {
    if (userRole === 'admin') {
      hasUserInteractedRef.current = true;
      markAllAsRead();
    }
  };

  const handleNotificationClick = (notification: AdminNotification) => {
    hasUserInteractedRef.current = true;
    
    if (notification.type === 'document_request') {
      const userId = notification.data?.user_id;
      
      if (userId) {
        router.push(`/admin/user/${userId}`);
        closeDropdown();
        
        if (!notification.is_read) {
          markAsRead(notification.id);
        }
      }
    }
  };

  const toggleDropdown = () => {
    hasUserInteractedRef.current = true;
    
    if (isOpen) {
      closeDropdown();
    } else {
      openDropdown();
    }
  };

  const closeDropdown = () => {
    setIsOpen(false);
  };

  const openDropdown = () => {
    setIsOpen(true);
    setPage(1);
    setHasMore(true);
    fetchNotifications(1, true);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.notification-dropdown')) {
        closeDropdown();
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative notification-dropdown">
      {/* Botão de notificações */}
      <button
        onClick={toggleDropdown}
        className="relative p-2 rounded-lg transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        title="Notificações"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-[-76px] md:right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[28rem] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">
                Notificações {unreadCount > 0 && `(${unreadCount})`}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {userRole === 'admin' && unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  title="Marcar todas como lidas"
                >
                  <CheckCheck size={14} />
                  Todas
                </button>
              )}
              <button
                onClick={closeDropdown}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Status de carregamento */}
          {loading && (
            <div className="p-3 bg-blue-50 border-b border-blue-200">
              <p className="text-sm text-blue-800">
                🔄 Carregando notificações...
              </p>
            </div>
          )}

          {/* Lista de notificações */}
          <div 
            ref={scrollContainerRef}
            className="max-h-80 overflow-y-auto"
          >
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Bell size={24} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Nenhuma notificação</p>
              </div>
            ) : (
              <>
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-3 border-b border-gray-100 transition-colors ${
                      !notification.is_read ? 'bg-blue-50' : ''
                    } ${
                      notification.type === 'document_request' 
                        ? 'hover:bg-gray-50 cursor-pointer' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg">
                        {getNotificationIcon(notification.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h4 className={`text-sm font-medium truncate ${
                            !notification.is_read ? 'text-gray-900' : 'text-gray-600'
                          }`}>
                            {notification.title}
                          </h4>
                          <div className="flex items-center gap-1 ml-2">
                            <span className="text-xs text-gray-500">
                              {formatTimeAgo(notification.created_at)}
                            </span>
                            {!notification.is_read && (
                              <button
                                onClick={(e) => handleMarkAsRead(notification.id, e)}
                                className="text-blue-600 hover:text-blue-800 p-1"
                                title="Marcar como lida"
                              >
                                <Check size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className={`text-sm mt-1 ${
                          !notification.is_read ? 'text-gray-700' : 'text-gray-500'
                        }`}>
                          {notification.message}
                        </p>
                        {notification.type === 'document_request' && (
                          <p className="text-xs text-blue-600 mt-1">
                            Clique para ver perfil do usuário
                          </p>
                        )}
                        {userRole === 'admin' && 'read_by_count' in notification && notification.read_by_count !== undefined && (
                          <p className="text-xs text-gray-400 mt-1">
                            Lida por {notification.read_by_count} admin(s)
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Trigger invisível para Intersection Observer */}
                {hasMore && !loadingMore && (
                  <div 
                    ref={loadMoreTriggerRef}
                    className="h-1 w-full"
                    aria-hidden="true"
                  />
                )}
                
                {/* Indicador de carregamento para mais notificações */}
                {loadingMore && (
                  <div className="p-3 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      <span className="text-sm">Carregando mais...</span>
                    </div>
                  </div>
                )}
                
                {/* Botão para carregar mais (fallback) */}
                {hasMore && !loadingMore && notifications.length >= 10 && (
                  <div className="p-3 text-center border-t border-gray-100">
                    <button
                      onClick={loadMoreNotifications}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center gap-2 w-full p-2 rounded hover:bg-blue-50 transition-colors"
                    >
                      📄 Carregar mais notificações
                    </button>
                  </div>
                )}
                
                {/* Indicador de fim das notificações */}
                {!hasMore && notifications.length > 10 && (
                  <div className="p-3 text-center text-gray-400 border-t border-gray-100">
                    <p className="text-xs">✅ Todas as notificações foram carregadas</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  router.push('/admin/notifications');
                  closeDropdown();
                }}
                className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Ver todas as notificações
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
