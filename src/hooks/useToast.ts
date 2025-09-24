import { toast, ToastOptions, Id } from 'react-toastify';
import { useToastSettings } from '../context/toastSettings';
import React from 'react';
import { ToastContent } from '../components/shared/ToastContent';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'notification';

export interface CustomToastOptions extends Omit<ToastOptions, 'type'> {
  type?: ToastType;
  notificationType?: 'document_request' | 'payment' | 'user_registration' | 'default';
  details?: string;
  actionText?: string;
  onAction?: () => void;
  showTimestamp?: boolean;
  notificationId?: number;
}

export const useToast = () => {
  const { settings } = useToastSettings();

  const showToast = (message: string, options?: CustomToastOptions): Id | null => {
    if (!settings.enabled) return null;

    const { 
      type = 'info', 
      notificationType = 'default', 
      details,
      actionText,
      onAction,
      showTimestamp = true,
      notificationId,
      ...toastOptions 
    } = options || {};

    const isNotificationTypeEnabled = () => {
      switch (notificationType) {
        case 'document_request':
          return settings.showForDocumentRequests;
        case 'payment':
          return settings.showForPayments;
        case 'user_registration':
          return settings.showForUserRegistrations;
        default:
          return true;
      }
    };

    if (!isNotificationTypeEnabled()) return null;

    const getNotificationConfig = () => {
      switch (notificationType) {
        case 'document_request':
          return {
            icon: '',
            className: 'toast-document-request',
            autoClose: settings.autoClose,
          };
        default:
          return {
            icon: '',
            className: 'toast-default',
            autoClose: settings.autoClose,
          };
      }
    };

    const notificationConfig = getNotificationConfig();

    const finalOptions: ToastOptions = {
      position: settings.position,
      autoClose: notificationConfig.autoClose,
      hideProgressBar: !settings.showProgress,
      closeOnClick: true,
      pauseOnHover: settings.pauseOnHover,
      draggable: true,
      progress: undefined,
      className: notificationConfig.className,
      ...toastOptions,
    };

    const toastContent = React.createElement(ToastContent, {
      icon: notificationConfig.icon,
      title: message,
      details,
      actionText,
      onAction,
      showTimestamp,
      notificationType,
      notificationId
    });

    switch (type) {
      case 'success':
        return toast.success(toastContent, finalOptions);
      case 'error':
        return toast.error(toastContent, finalOptions);
      case 'warning':
        return toast.warning(toastContent, finalOptions);
      case 'notification':
      case 'info':
      default:
        return toast.info(toastContent, finalOptions);
    }
  };

  const showSuccessToast = (message: string, options?: CustomToastOptions) => {
    return showToast(message, { ...options, type: 'success' });
  };

  const showErrorToast = (message: string, options?: CustomToastOptions) => {
    return showToast(message, { ...options, type: 'error' });
  };

  const showWarningToast = (message: string, options?: CustomToastOptions) => {
    return showToast(message, { ...options, type: 'warning' });
  };

  const showNotificationToast = (message: string, options?: CustomToastOptions) => {
    return showToast(message, { ...options, type: 'notification' });
  };

  const dismissToast = (toastId: Id) => {
    toast.dismiss(toastId);
  };

  const dismissAllToasts = () => {
    toast.dismiss();
  };

  return {
    showToast,
    showSuccessToast,
    showErrorToast,
    showWarningToast,
    showNotificationToast,
    dismissToast,
    dismissAllToasts,
  };
};
