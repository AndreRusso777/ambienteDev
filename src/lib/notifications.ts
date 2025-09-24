import { queryDb } from './db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { AdminNotification, Notification } from '../types/notification';

/**
 * Função auxiliar para fazer parse seguro de JSON
 */
function safeJsonParse(jsonString: any, notificationId?: number): any {
  if (!jsonString) return null;
  
  // Se já é um objeto, retorna como está
  if (typeof jsonString === 'object') return jsonString;
  
  // Se não é string, tenta converter
  if (typeof jsonString !== 'string') {
    console.warn(`Dados inválidos para notificação ${notificationId}: tipo ${typeof jsonString}`);
    return null;
  }
  
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn(`Erro ao fazer parse do JSON para notificação ${notificationId}:`, error);
    console.warn('Dados originais:', jsonString);
    return null;
  }
}

export class NotificationManager {
  /**
   * Cria uma notificação para todos os administradores
   */
  static async createAdminNotification(data: {
    type: string;
    title: string;
    message: string;
    related_id?: number;
    related_type?: string;
    data?: any;
  }): Promise<AdminNotification> {
    const { type, title, message, related_id, related_type, data: extraData } = data;
    
    const result = await queryDb<ResultSetHeader>(
      `INSERT INTO admin_notifications (type, title, message, related_id, related_type, data) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [type, title, message, related_id || null, related_type || null, extraData ? JSON.stringify(extraData) : null]
    );

    const notification = await this.getAdminNotification(result.insertId);
    if (!notification) {
      throw new Error('Falha ao criar notificação para administradores');
    }

    return notification;
  }

  /**
   * Cria uma notificação para um usuário específico
   */
  static async createUserNotification(data: {
    user_id: number;
    type: string;
    title: string;
    message: string;
    related_id?: number;
    related_type?: string;
  }): Promise<Notification> {
    const { user_id, type, title, message, related_id, related_type } = data;
    
    const result = await queryDb<ResultSetHeader>(
      `INSERT INTO notifications (user_id, type, title, message, related_id, related_type) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user_id, type, title, message, related_id || null, related_type || null]
    );

    const notification = await this.getUserNotification(result.insertId);
    if (!notification) {
      throw new Error('Falha ao criar notificação para usuário');
    }

    return notification;
  }

  /**
   * Busca uma notificação de admin por ID
   */
  static async getAdminNotification(id: number): Promise<AdminNotification | null> {
    const rows = await queryDb<RowDataPacket[]>(
      'SELECT * FROM admin_notifications WHERE id = ?',
      [id]
    );

    if (!rows.length) return null;

    const notification = rows[0];
    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      related_id: notification.related_id,
      related_type: notification.related_type,
      data: safeJsonParse(notification.data, notification.id),
      created_at: notification.created_at
    };
  }

  /**
   * Busca uma notificação de usuário por ID
   */
  static async getUserNotification(id: number): Promise<Notification | null> {
    const rows = await queryDb<RowDataPacket[]>(
      'SELECT * FROM notifications WHERE id = ?',
      [id]
    );

    if (!rows.length) return null;

    const notification = rows[0];
    return {
      id: notification.id,
      user_id: notification.user_id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      related_id: notification.related_id,
      related_type: notification.related_type,
      is_read: Boolean(notification.is_read),
      created_at: notification.created_at,
      read_at: notification.read_at
    };
  }

  /**
   * Busca todas as notificações para administradores com status de leitura
   */
  static async getAdminNotifications(adminId: number, limit = 50): Promise<AdminNotification[]> {
    const rows = await queryDb<RowDataPacket[]>(
      `SELECT 
        an.*,
        CASE WHEN anr.admin_id IS NOT NULL THEN 1 ELSE 0 END as is_read,
        (SELECT COUNT(*) FROM admin_notification_reads WHERE notification_id = an.id) as read_by_count
       FROM admin_notifications an
       LEFT JOIN admin_notification_reads anr ON an.id = anr.notification_id AND anr.admin_id = ?
       ORDER BY an.created_at DESC
       LIMIT ?`,
      [adminId, limit]
    );

    return rows.map(row => ({
      id: row.id,
      type: row.type,
      title: row.title,
      message: row.message,
      related_id: row.related_id,
      related_type: row.related_type,
      data: safeJsonParse(row.data, row.id),
      created_at: row.created_at,
      is_read: Boolean(row.is_read),
      read_by_count: row.read_by_count
    }));
  }

  /**
   * Busca notificações não lidas para um admin
   */
  static async getUnreadAdminNotifications(adminId: number): Promise<AdminNotification[]> {
    const rows = await queryDb<RowDataPacket[]>(
      `SELECT an.*
       FROM admin_notifications an
       LEFT JOIN admin_notification_reads anr ON an.id = anr.notification_id AND anr.admin_id = ?
       WHERE anr.admin_id IS NULL
       ORDER BY an.created_at DESC`,
      [adminId]
    );

    return rows.map(row => ({
      id: row.id,
      type: row.type,
      title: row.title,
      message: row.message,
      related_id: row.related_id,
      related_type: row.related_type,
      data: safeJsonParse(row.data, row.id),
      created_at: row.created_at,
      is_read: false
    }));
  }

  /**
   * Busca notificações de admin com paginação
   */
  static async getAdminNotificationsPaginated(
    adminId: number, 
    limit = 10, 
    offset = 0
  ): Promise<{ notifications: AdminNotification[], total: number }> {
    // Buscar notificações com paginação
    const notificationRows = await queryDb<RowDataPacket[]>(
      `SELECT 
        an.*,
        CASE WHEN anr.admin_id IS NOT NULL THEN 1 ELSE 0 END as is_read,
        (SELECT COUNT(*) FROM admin_notification_reads WHERE notification_id = an.id) as read_by_count
       FROM admin_notifications an
       LEFT JOIN admin_notification_reads anr ON an.id = anr.notification_id AND anr.admin_id = ?
       ORDER BY an.created_at DESC
       LIMIT ? OFFSET ?`,
      [adminId, limit, offset]
    );

    // Contar total de notificações
    const countRows = await queryDb<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM admin_notifications`,
      []
    );

    const notifications = notificationRows.map(row => ({
      id: row.id,
      type: row.type,
      title: row.title,
      message: row.message,
      related_id: row.related_id,
      related_type: row.related_type,
      data: safeJsonParse(row.data, row.id),
      created_at: row.created_at,
      is_read: Boolean(row.is_read),
      read_by_count: row.read_by_count
    }));

    const total = countRows[0]?.total || 0;

    return { notifications, total };
  }

  /**
   * Marca uma notificação de admin como lida
   */
  static async markAdminNotificationAsRead(notificationId: number, adminId: number): Promise<void> {
    await queryDb(
      `INSERT IGNORE INTO admin_notification_reads (notification_id, admin_id) 
       VALUES (?, ?)`,
      [notificationId, adminId]
    );
  }

  /**
   * Marca todas as notificações de admin como lidas para um admin
   */
  static async markAllAdminNotificationsAsRead(adminId: number): Promise<void> {
    await queryDb(
      `INSERT IGNORE INTO admin_notification_reads (notification_id, admin_id)
       SELECT id, ? FROM admin_notifications 
       WHERE id NOT IN (
         SELECT notification_id FROM admin_notification_reads WHERE admin_id = ?
       )`,
      [adminId, adminId]
    );
  }

  /**
   * Conta notificações não lidas para um admin
   */
  static async getUnreadAdminNotificationCount(adminId: number): Promise<number> {
    const rows = await queryDb<RowDataPacket[]>(
      `SELECT COUNT(*) as count
       FROM admin_notifications an
       LEFT JOIN admin_notification_reads anr ON an.id = anr.notification_id AND anr.admin_id = ?
       WHERE anr.admin_id IS NULL`,
      [adminId]
    );

    return rows[0]?.count || 0;
  }

  /**
   * Busca todas as notificações para um usuário
   */
  static async getUserNotifications(userId: number, limit = 50): Promise<Notification[]> {
    const rows = await queryDb<RowDataPacket[]>(
      `SELECT * FROM notifications 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ?`,
      [userId, limit]
    );

    return rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      type: row.type,
      title: row.title,
      message: row.message,
      related_id: row.related_id,
      related_type: row.related_type,
      is_read: Boolean(row.is_read),
      created_at: row.created_at,
      read_at: row.read_at
    }));
  }

  /**
   * Marca uma notificação de usuário como lida
   */
  static async markUserNotificationAsRead(notificationId: number, userId: number): Promise<void> {
    await queryDb(
      `UPDATE notifications 
       SET is_read = 1, read_at = NOW() 
       WHERE id = ? AND user_id = ?`,
      [notificationId, userId]
    );
  }

  /**
   * Conta notificações não lidas para um usuário
   */
  static async getUnreadUserNotificationCount(userId: number): Promise<number> {
    const rows = await queryDb<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM notifications 
       WHERE user_id = ? AND is_read = 0`,
      [userId]
    );

    return rows[0]?.count || 0;
  }

  /**
   * Busca todos os IDs de administradores
   */
  static async getAllAdminIds(): Promise<number[]> {
    const rows = await queryDb<RowDataPacket[]>(
      "SELECT id FROM users WHERE role = 'admin'"
    );

    return rows.map(row => row.id);
  }
}
