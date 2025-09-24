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

    // Parâmetros de paginação
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    // Buscar notificações paginadas
    const { notifications, total } = await NotificationManager.getAdminNotificationsPaginated(
      session.userId, 
      limit, 
      offset
    );

    // Buscar total de não lidas separadamente
    const unreadCount = await NotificationManager.getUnreadAdminNotificationCount(session.userId);

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasMore: page < totalPages
        }
      }
    });

  } catch (error) {
    console.error('Erro ao buscar notificações paginadas:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}
