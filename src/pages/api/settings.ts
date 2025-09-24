import type { NextApiRequest, NextApiResponse } from 'next';
import { queryDb } from '@/lib/db';
import { validateSession } from '@/lib/auth';
import type { UserSettings } from '@/types/settings';

interface UserSettingsResponse {
  success: boolean;
  data?: UserSettings;
  message?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UserSettingsResponse>
) {
  try {
    // Verificar autenticação
    const { auth_session: sessionId } = req.cookies;
    const { session } = await validateSession(sessionId);
    
    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Não autorizado'
      });
    }

    const userId = session.userId;

    if (req.method === 'GET') {
      // Buscar configurações do usuário
      try {
        const rows = await queryDb(
          'SELECT setting_key, setting_value FROM user_settings WHERE user_id = ?',
          [userId]
        );

        const settings: any = {};
        (rows as any[]).forEach((row) => {
          try {
            settings[row.setting_key] = JSON.parse(row.setting_value);
          } catch {
            settings[row.setting_key] = row.setting_value;
          }
        });

        // Aplicar configurações padrão para campos faltantes
        const userSettings: UserSettings = {
          notifications: {
            sound_enabled: settings.notifications?.sound_enabled ?? true,
            sound_volume: settings.notifications?.sound_volume ?? 0.6,
            sound_type: settings.notifications?.sound_type ?? 'bell',
            browser_notifications: settings.notifications?.browser_notifications ?? true,
            email_notifications: settings.notifications?.email_notifications ?? true,
            notification_types: {
              document_requests: settings.notifications?.notification_types?.document_requests ?? true,
              payments: settings.notifications?.notification_types?.payments ?? true,
              user_registrations: settings.notifications?.notification_types?.user_registrations ?? true,
              system_updates: settings.notifications?.notification_types?.system_updates ?? true,
            }
          },
          theme: settings.theme ?? 'light',
          language: settings.language ?? 'pt-BR'
        };

        return res.status(200).json({
          success: true,
          data: userSettings
        });

      } catch (error) {
        console.error('Erro ao buscar configurações:', error);
        return res.status(500).json({
          success: false,
          message: 'Erro interno do servidor'
        });
      }
    }

    if (req.method === 'PUT') {
      // Atualizar configurações do usuário
      const { setting_key, setting_value } = req.body;

      if (!setting_key || setting_value === undefined) {
        return res.status(400).json({
          success: false,
          message: 'setting_key e setting_value são obrigatórios'
        });
      }

      try {
        // Primeiro tentar inserir
        try {
          await queryDb(
            'INSERT INTO user_settings (user_id, setting_key, setting_value) VALUES (?, ?, ?)',
            [userId, setting_key, JSON.stringify(setting_value)]
          );
        } catch (insertError: any) {
          // Se der erro de chave duplicada, fazer update
          if (insertError.code === 'ER_DUP_ENTRY') {
            await queryDb(
              'UPDATE user_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND setting_key = ?',
              [JSON.stringify(setting_value), userId, setting_key]
            );
          } else {
            throw insertError;
          }
        }

        return res.status(200).json({
          success: true,
          message: 'Configurações atualizadas com sucesso'
        });

      } catch (error) {
        console.error('Erro ao atualizar configurações:', error);
        return res.status(500).json({
          success: false,
          message: 'Erro interno do servidor'
        });
      }
    }

    // Método não permitido
    return res.status(405).json({
      success: false,
      message: 'Método não permitido'
    });

  } catch (error) {
    console.error('Erro geral na API de configurações:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}
