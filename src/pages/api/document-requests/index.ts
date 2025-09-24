import { 
  getDocumentRequests, 
  getAllDocumentRequestsOptimized,
  getRequestDetailsWithCache,
  invalidateRequestCache,
  createDocumentRequest, 
  updateRequestStatus, 
  getDocumentRequestById
} from "@/lib/document-requests";
import sendEmail from "@/lib/email";
import { FormErrors } from "@/types/form";
import { NextApiRequest, NextApiResponse } from "next";

// Cache para listas
const listCache = new Map<string, { data: any, timestamp: number }>();
const LIST_CACHE_DURATION = 60000; // 1 minuto

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const apiToken = (req.headers.authorization || '').split("Bearer ").at(1);

  if (!apiToken || apiToken !== process.env.NEXT_PUBLIC_API_TOKEN) {
    return res.status(403).json({ success: false, errors: {} });
  }

  if (req.method === "GET") {
    const { 
      userId, 
      admin, 
      page = 1, 
      limit = 10, 
      nocache,
      status,
      clientName,
      dateFrom,
      dateTo,
      sortBy
    } = req.query;

    // Criar chave de cache incluindo filtros
    const filterParams = [status, clientName, dateFrom, dateTo, sortBy].filter(Boolean).join('-');
    const cacheKey = admin === 'true' 
      ? `admin-${page}-${limit}-${filterParams}` 
      : `user-${userId}`;
    
    if (!nocache) {
      const cached = listCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < LIST_CACHE_DURATION) {
        return res.status(200).json({ 
          success: true, 
          data: { 
            requests: cached.data.requests,
            totalRequests: cached.data.totalRequests
          },
          cached: true
        });
      }
    }

    try {
      let result;
      
      if (admin === 'true') {
        const filters = {
          status: status as string,
          sortBy: sortBy as 'newest' | 'oldest',
          clientName: clientName as string,
          dateFrom: dateFrom as string,
          dateTo: dateTo as string
        };
        
        console.log('🔍 API - Filtros recebidos:', {
          status,
          sortBy,
          clientName,
          dateFrom,
          dateTo,
          page,
          limit
        });
        
        console.log('🔍 API - Objeto filters montado:', filters);
        
        result = await getAllDocumentRequestsOptimized(
          parseInt(page as string), 
          parseInt(limit as string),
          filters
        );
      } else if (userId) {
        const requests = await getDocumentRequests(parseInt(userId as string));
        result = { requests, totalRequests: requests.length };
      } else {
        return res.status(400).json({ 
          success: false, 
          errors: { global: { message: "Parâmetro userId ou admin necessário" } } 
        });
      }

      // Armazenar no cache
      listCache.set(cacheKey, { data: result, timestamp: Date.now() });

      return res.status(200).json({ 
        success: true, 
        data: result,
        cached: false
      });
    } catch (error) {
      console.error('Erro ao buscar solicitações:', error);
      return res.status(500).json({ 
        success: false, 
        errors: { global: { message: "Erro interno do servidor" } } 
      });
    }
  }

  if (req.method === "POST") {
    const errors: FormErrors = {};
    const { userId, title, message, documentType, action } = req.body;

    if (action === "create") {
      // Validações...
      if (!userId) {
        errors['global'] = { message: "ID do usuário é obrigatório" };
        return res.status(400).json({ success: false, errors });
      }

      if (!title?.trim()) {
        errors['title'] = { message: "Título é obrigatório" };
      }

      if (Object.keys(errors).length > 0) {
        return res.status(400).json({ success: false, errors });
      }

      try {
        const request = await createDocumentRequest(
          userId, 
          title.trim(), 
          message?.trim(),
          documentType
        );

        // Invalidar caches relevantes
        listCache.clear();

        // Enviar email de forma assíncrona para não bloquear resposta
        setImmediate(async () => {
          try {
            await sendEmail({
              type: "Nova Solicitação de Documento",
              recipient: process.env.ADMIN_EMAIL || "admin@exemplo.com",
              subject: "Nova Solicitação de Documento",
              html: `
                <h2 style="font-size:20px;font-weight:700;line-height:28px;color:black">Nova solicitação de documento</h2>
                <p style="font-size:16px;font-weight:400;line-height:20px;color:grey;margin-top:10px">Um cliente fez uma nova solicitação de documento</p>
                <ul style="margin-top:14px;margin-bottom:0;padding-left:16px">
                  <li><strong>Título:</strong> ${title}</li>
                  <li><strong>Tipo de Documento:</strong> ${documentType || 'Não especificado'}</li>
                  ${message ? `<li><strong>Mensagem:</strong> ${message}</li>` : ''}
                  <li><strong>Cliente ID:</strong> ${userId}</li>
                </ul>
                <p style="margin-top:40px">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin" style="font-size:14px;text-decoration:none;color:white;background-color:#212121;border-radius:8px;padding:8px 14px" target="_blank">Ver Solicitação</a>
                </p>
              `
            });
          } catch (emailError) {
            console.error('Erro ao enviar email:', emailError);
          }
        });

        return res.status(201).json({ 
          success: true, 
          message: "Solicitação criada com sucesso!", 
          errors: {}, 
          data: { request, requestId: request.id } 
        });
      } catch (error) {
        console.error("Error while creating document request:", error);
        errors['global'] = { message: "Erro ao criar solicitação" };
        return res.status(500).json({ success: false, errors });
      }
    }

    return res.status(400).json({ success: false, errors: { global: { message: "Ação inválida" } } });
  }

  if (req.method === "PUT") {
    const errors: FormErrors = {};
    const { requestId, status, adminMessage, respondedBy } = req.body;

    if (!requestId || !status) {
      errors['global'] = { message: "Dados obrigatórios não fornecidos" };
      return res.status(400).json({ success: false, errors });
    }

    if (respondedBy && (!respondedBy.id || !respondedBy.name)) {
      errors['global'] = { message: "Dados do administrador inválidos" };
      return res.status(400).json({ success: false, errors });
    }

    try {
      // Buscar dados da solicitação antes de atualizar para enviar email
      const requestDetails = await getDocumentRequestById(requestId);
      
      if (!requestDetails) {
        errors['global'] = { message: "Solicitação não encontrada" };
        return res.status(404).json({ success: false, errors });
      }

      await updateRequestStatus(
        requestId, 
        status, 
        adminMessage?.trim(), 
        respondedBy?.id, 
        respondedBy?.name
      );

      // Invalidar caches
      listCache.clear();
      invalidateRequestCache(requestId);

      // Enviar email de notificação para o usuário
      if (status === 'completed' || status === 'rejected') {
        setImmediate(async () => {
          try {
            const statusText = status === 'completed' ? 'aprovada' : 'rejeitada';
            const statusColor = status === 'completed' ? '#22c55e' : '#ef4444';
            
            await sendEmail({
              type: `Solicitação ${statusText}`,
              recipient: (requestDetails as any).email,
              subject: `Solicitação ${statusText}: ${requestDetails.title}`,
              html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="font-size: 24px; font-weight: 700; color: ${statusColor}; margin-bottom: 16px;">
                Solicitação ${statusText}
                </h2>
                
                <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 12px; color: #1f2937;">
                  ${requestDetails.title}
                </h3>
                <p style="color: #6b7280; margin-bottom: 8px;">
                  <strong>Sua solicitação:</strong> ${requestDetails.message || 'Sem mensagem adicional'}
                </p>
                <p style="color: #6b7280; margin: 0;">
                  <strong>Data da solicitação:</strong> ${new Date(requestDetails.created_at).toLocaleDateString('pt-BR')}
                </p>
                </div>

                <div style="background-color: ${status === 'completed' ? '#f0fdf4' : '#fef2f2'}; border-left: 4px solid ${statusColor}; padding: 16px; border-radius: 4px; margin-bottom: 20px;">
                <h4 style="font-size: 16px; font-weight: 600; margin-bottom: 8px; color: ${status === 'completed' ? '#166534' : '#991b1b'};">
                  ${status === 'completed' ? 'Motivo da aprovação:' : 'Motivo da rejeição:'}
                </h4>
                <p style="color: ${status === 'completed' ? '#166534' : '#991b1b'}; margin: 0;">
                  ${adminMessage}
                </p>
                </div>

                ${status === 'completed' ? `
                <div style="background-color: #eff6ff; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                  <p style="color: #1e40af; margin: 0;">
                  🎉 <strong>Parabéns!</strong> Sua solicitação foi aprovada. Agora você pode enviar o documento solicitado diretamente pela plataforma. Acesse sua conta e envie o arquivo através do botão abaixo.
                  </p>
                </div>
                ` : `
                <div style="background-color: #fef3c7; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                  <p style="color: #92400e; margin: 0;">
                  ℹ️ <strong>Atenção:</strong> Sua solicitação foi rejeitada. Caso tenha dúvidas sobre o motivo, entre em contato conosco.
                  </p>
                </div>
                `}

                <div style="text-align: center; margin-top: 32px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                   style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                  Acessar Plataforma
                </a>
                </div>

                <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
                  Este é um email automático. Caso tenha dúvidas, entre em contato conosco.
                </p>
                </div>
              </div>
              `
            });
          } catch (emailError) {
            console.error('Erro ao enviar email de notificação:', emailError);
          }
        });
      }

      return res.status(200).json({ 
        success: true, 
        message: "Status atualizado com sucesso!", 
        errors: {} 
      });
    } catch (error) {
      console.error("Error while updating request status:", error);
      errors['global'] = { message: "Erro ao atualizar status" };
      return res.status(500).json({ success: false, errors });
    }
  }

  res.setHeader("Allow", ["GET", "POST", "PUT"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}