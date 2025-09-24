import { NextApiRequest, NextApiResponse } from 'next';
import { NotificationManager } from '@/lib/notifications';
import { validateSession } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

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

    // Marcar todas como lidas
    await NotificationManager.markAllAdminNotificationsAsRead(session.userId);
    
    return res.status(200).json({
      success: true,
      message: 'Todas as notificações foram marcadas como lidas'
    });

  } catch (error) {
    console.error('Erro ao marcar todas as notificações como lidas:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}
