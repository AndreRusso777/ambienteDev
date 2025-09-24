export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  related_id?: number;
  related_type?: string;
  is_read: boolean;
  created_at: string;
  read_at?: string;
}

export interface AdminNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  related_id?: number;
  related_type?: string;
  data?: any;
  created_at: string;
  is_read?: boolean;
  read_by_count?: number;
}

export interface AdminNotificationRead {
  id: number;
  notification_id: number;
  admin_id: number;
  read_at: string;
}
