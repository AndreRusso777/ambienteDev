import { NotificationManager } from './notifications';

/**
 * Cria e envia notificação para administradores sobre nova solicitação de documento
 */
export async function notifyAdminsNewDocumentRequest(documentRequest: any) {
  try {    
    // Criar notificação no banco
    const notification = await NotificationManager.createAdminNotification({
      type: 'document_request',
      title: 'Nova Solicitação de Documento',
      message: `${documentRequest.user_name || 'Usuário'} solicitou: ${documentRequest.title}`,
      related_id: documentRequest.id,
      related_type: 'document_requests',
      data: {
        document_type: documentRequest.document_type,
        user_id: documentRequest.user_id,
        user_name: documentRequest.user_name
      }
    });
    
    return notification;
  } catch (error) {
    console.error('Erro ao notificar administradores sobre nova solicitação:', error);
    throw error;
  }
}

/**
 * Cria e envia notificação para usuário sobre atualização de solicitação
 */
export async function notifyUserDocumentRequestUpdate(userId: number, documentRequest: any, updateType: string) {
  try {
    let title = '';
    let message = '';

    switch (updateType) {
      case 'status_updated':
        title = 'Solicitação Atualizada';
        message = `Sua solicitação "${documentRequest.title}" foi atualizada para: ${documentRequest.status}`;
        break;
      case 'response_added':
        title = 'Nova Resposta';
        message = `Você recebeu uma resposta para sua solicitação "${documentRequest.title}"`;
        break;
      default:
        title = 'Solicitação Atualizada';
        message = `Sua solicitação "${documentRequest.title}" foi atualizada`;
    }

    // Criar notificação no banco
    const notification = await NotificationManager.createUserNotification({
      user_id: userId,
      type: 'document_request_update',
      title,
      message,
      related_id: documentRequest.id,
      related_type: 'document_request'
    });
    
    return notification;
  } catch (error) {
    console.error('Erro ao notificar usuário sobre atualização:', error);
    throw error;
  }
}
