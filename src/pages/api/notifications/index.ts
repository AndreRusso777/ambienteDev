import { NextApiRequest, NextApiResponse } from 'next';
import { NotificationManager } from '@/lib/notifications';
import { validateSession } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  // Headers para evitar cache
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    // Verificar autenticação
    const { auth_session: sessionId } = req.cookies;    
    const { session } = await validateSession(sessionId);

    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Não autenticado'
      });
    }

    // Buscar notificações do admin
    const notifications = await NotificationManager.getAdminNotifications(session.userId);
    const unreadCount = notifications.filter(n => !n.is_read).length;

    return res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
        userId: session.userId
      }
    });

  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}
