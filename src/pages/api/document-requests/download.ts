import { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import fs from "fs";
import { getDocumentRequestById } from "@/lib/document-requests";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const apiToken = (req.headers.authorization || '').split("Bearer ").at(1);
  if (!apiToken || apiToken !== process.env.NEXT_PUBLIC_API_TOKEN) {
    return res.status(403).json({ success: false, errors: {} });
  }

  const { requestId, userId } = req.query;

  if (!requestId || !userId) {
    return res.status(400).json({ 
      success: false, 
      error: "requestId e userId são obrigatórios" 
    });
  }

  try {
    // Buscar detalhes da solicitação
    const request = await getDocumentRequestById(parseInt(requestId as string));
    
    if (!request) {
      return res.status(404).json({ 
        success: false, 
        error: "Solicitação não encontrada" 
      });
    }

    // Verificar se o usuário tem permissão para baixar este arquivo
    if (request.user_id !== parseInt(userId as string)) {
      return res.status(403).json({ 
        success: false, 
        error: "Acesso negado" 
      });
    }

    // Verificar se a solicitação tem arquivo anexado
    if (!request.file_path || !request.file_name) {
      return res.status(404).json({ 
        success: false, 
        error: "Arquivo não encontrado para esta solicitação" 
      });
    }

    // Construir o caminho completo do arquivo
    const filePath = path.join(process.cwd(), request.file_path);

    // Verificar se o arquivo existe
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        success: false, 
        error: "Arquivo não encontrado no sistema" 
      });
    }

    // Ler o arquivo
    const fileBuffer = fs.readFileSync(filePath);
    
    // Criar nome do arquivo com título da solicitação e nome do cliente
    const clientName = `${request.first_name || ''} ${request.last_name || ''}`.trim();
    const title = request.title || 'Solicitacao';
    
    // Limpar caracteres especiais do nome do arquivo
    const sanitizedTitle = title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
    const sanitizedClientName = clientName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
    
    // Obter extensão do arquivo original
    const originalExtension = path.extname(request.file_name || '');
    
    // Construir novo nome do arquivo
    const newFileName = `${sanitizedTitle} - ${sanitizedClientName}${originalExtension}`;
    
    // Definir headers para download
    res.setHeader('Content-Type', request.file_mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${newFileName}"`);
    res.setHeader('Content-Length', fileBuffer.length);

    // Enviar o arquivo
    res.send(fileBuffer);

  } catch (error) {
    console.error('Erro ao fazer download do arquivo:', error);
    return res.status(500).json({ 
      success: false, 
      error: "Erro interno do servidor" 
    });
  }
}
