import { NextApiRequest, NextApiResponse } from "next";
import { getRequestDetailsWithCache } from "@/lib/document-requests";

// Armazenar conexões ativas
const connections = new Map<string, { res: NextApiResponse; userId: number; isAdmin: boolean }>();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const apiToken = (req.headers.authorization || '').split("Bearer ").at(1) || req.query.token;

  if (!apiToken || apiToken !== process.env.NEXT_PUBLIC_API_TOKEN) {
    return res.status(403).json({ success: false, errors: {} });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { id } = req.query;
  const requestId = parseInt(id as string);

  if (isNaN(requestId)) {
    return res.status(400).json({ 
      success: false, 
      errors: { global: { message: "ID da solicitação inválido" } } 
    });
  }

  try {
    const details = await getRequestDetailsWithCache(requestId);
    
    if (!details.request) {
      return res.status(404).json({ 
        success: false, 
        errors: { global: { message: "Solicitação não encontrada" } } 
      });
    }

    return res.status(200).json({ 
      success: true, 
      data: details 
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes da solicitação:', error);
    return res.status(500).json({ 
      success: false, 
      errors: { global: { message: "Erro interno do servidor" } } 
    });
  }
}

// Função para notificar todas as conexões relevantes
export function notifyConnections(requestId: number, data: any, eventType: 'new_message' | 'status_update' | 'new_request') {
  connections.forEach(({ res, userId, isAdmin }, connectionId) => {
    try {
      // Admins recebem todas as notificações
      // Usuários só recebem notificações de suas próprias solicitações
      if (isAdmin || (data.request && data.request.user_id === userId)) {
        res.write(`event: ${eventType}\ndata: ${JSON.stringify({ requestId, ...data })}\n\n`);
      }
    } catch (error) {
      console.error(`Erro ao notificar conexão ${connectionId}:`, error);
      connections.delete(connectionId);
    }
  });
}