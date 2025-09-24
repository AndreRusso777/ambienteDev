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

      const { notificationId } = req.query;

      if (!notificationId || Array.isArray(notificationId)) {
        return res.status(400).json({
          success: false,
          message: 'ID da notificação é obrigatório'
        });
      }

      const id = parseInt(notificationId as string);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID da notificação inválido'
        });
      }

      // Marcar como lida
      await NotificationManager.markAdminNotificationAsRead(id, session.userId);

      return res.status(200).json({
        success: true,
        message: 'Notificação marcada como lida'
      });

    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }
