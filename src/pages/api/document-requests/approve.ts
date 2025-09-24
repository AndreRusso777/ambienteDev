import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import { approveDocumentRequestAndMoveFile, getDocumentRequestById } from "@/lib/document-requests";
import { createApprovedDocumentWithFile } from "@/lib/documents";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const apiToken = (req.headers.authorization || '').split("Bearer ").at(1);
  if (!apiToken || apiToken !== process.env.NEXT_PUBLIC_API_TOKEN) {
    return res.status(403).json({ success: false, errors: {} });
  }

  try {
    const { requestId, adminMessage, respondedBy } = req.body;

    if (!requestId) {
      return res.status(400).json({
        success: false,
        errors: { global: { message: "ID da solicitação é obrigatório" } }
      });
    }

    if (!respondedBy || !respondedBy.id || !respondedBy.name) {
      return res.status(400).json({
        success: false,
        errors: { global: { message: "Dados do administrador são obrigatórios" } }
      });
    }

    // Buscar a solicitação
    const request = await getDocumentRequestById(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        errors: { global: { message: "Solicitação não encontrada" } }
      });
    }

    let newFilePath = "";

    // Se tem arquivo anexado, mover da pasta temp para definitiva
    if (request.has_attachment && request.file_path) {
      const documentsDir = path.join(process.cwd(), 'documents');
      
      /**
       * Create user-specific folder if it doesn't exist
       */
      const userFolderName = `${request.user_id}`;
      const userDir = path.join(documentsDir, userFolderName);
      
      if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
      }
      
      const tempFilePath = path.join(process.cwd(), request.file_path);
      
      if (fs.existsSync(tempFilePath)) {
        // Gerar novo nome para pasta definitiva
        const fileName = request.file_name || path.basename(tempFilePath);
        const finalFilePath = path.join(userDir, fileName);
        
        /**
         * Move the file from temp to final directory
         */
        fs.renameSync(tempFilePath, finalFilePath);
        newFilePath = finalFilePath.replace(process.cwd(), '');

        // Criar registro na tabela documents com status aprovado
        try {
          await createApprovedDocumentWithFile(
            request.user_id,
            request.title,
            fileName,
            newFilePath,
            request.file_mime_type || 'application/octet-stream',
            request.file_size || 0
          );
        } catch (docError) {
          console.error("Erro ao criar documento:", docError);
          // Continuar mesmo se der erro na criação do documento
        }
      } else {
        console.warn(`Arquivo temporário não encontrado: ${tempFilePath}`);
      }
    }

    // Atualizar status da solicitação
    await approveDocumentRequestAndMoveFile(
      requestId,
      newFilePath || request.file_path || '',
      adminMessage,
      respondedBy.id,
      respondedBy.name
    );

    return res.status(200).json({
      success: true,
      message: "Solicitação aprovada com sucesso",
      data: {
        newFilePath
      }
    });

  } catch (error) {
    console.error("Erro ao aprovar solicitação:", error);
    return res.status(500).json({
      success: false,
      errors: { global: { message: "Erro interno do servidor" } }
    });
  }
}
