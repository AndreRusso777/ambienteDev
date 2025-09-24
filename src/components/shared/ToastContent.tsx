import React from 'react';
import { useRouter } from 'next/router';

interface ToastContentProps {
  icon: string;
  title: string;
  details?: string;
  actionText?: string;
  onAction?: () => void;
  showTimestamp?: boolean;
  notificationType: string;
  notificationId?: number;
}

export const ToastContent: React.FC<ToastContentProps> = ({ 
  details, 
  actionText, 
  onAction, 
  notificationType,
  notificationId
}) => {
  const router = useRouter();

  const handleToastClick = async () => {
    if (notificationId) {
      try {
        await fetch(`/api/notifications/${notificationId}/read`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        console.error('Erro ao marcar notificação como lida:', error);
      }
    }

    if (notificationType === 'document_request') {
      router.push('/admin?tab=document-requests');
    }
  };

  return (
    <div 
      className="flex flex-col gap-2 w-full p-4 cursor-pointer"
      onClick={handleToastClick}
    >
      {details && (
        <div className="text-xs opacity-80 leading-relaxed">
          {details}
        </div>
      )}

      {actionText && onAction && (
        <div className="flex items-center justify-between mt-1 pt-2 border-t border-current border-opacity-20">
          <button
            onClick={onAction}
            className="text-xs font-medium underline hover:no-underline transition-all duration-200 flex items-center gap-1"
          >
            {actionText}
            <span>→</span>
          </button>
          <span className="text-xs opacity-60">
            Clique para ver mais
          </span>
        </div>
      )}
    </div>
  );
};
