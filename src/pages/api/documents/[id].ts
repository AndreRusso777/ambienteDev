import { FormErrors } from "@/types/form";
import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import { deleteDocument, getDocumentById, updateDocumentApproval, updateDocumentToken } from "@/lib/documents";
import { Document } from "@/types/document";
import sendEmail from "@/lib/email";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PUT" && req.method !== "DELETE") {
    res.setHeader("Allow", ["PUT", "DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const apiToken = (req.headers.authorization || '').split("Bearer ").at(1);

  if (!apiToken || apiToken !== process.env.NEXT_PUBLIC_API_TOKEN) {
    return res.status(403).json({ success: false, errors: {} });
  }

  if(req.method === "PUT" && req.body.token) {
    const errors: FormErrors = {};
    const { id } = req.query;
    const { token, token_expiry } = req.body;
    const documentId = Array.isArray(id) ? parseInt(id[0]) : id ? parseInt(id) : null;

    if (!documentId) {
      errors['global'] = { message: "ID do documento é inválido" };
      return res.status(400).json({ success: false, errors });
    }

    let doc: Document | null = null;
    try {
      doc = await updateDocumentToken(documentId, token, token_expiry);
    } catch(err) {
      console.error("Unexpected error while trying to update document:", err);
      errors['global'] = { message: "Erro ao tentar atualizar token do documento" };
      res.status(500).json({ success: false, errors });
    }

    if(!doc) {
      console.error("Failed while trying to update document");
      errors['global'] = { message: "Não foi possível criar contrato" };
      return res.status(500).json({ success: false, errors });
    }

    return res.status(204).json({ document: doc });
  } else if(req.method === "PUT") {
    const errors: FormErrors = {};
    const { id } = req.query;
    const { approved, userEmail } = req.body;
    const documentId = Array.isArray(id) ? parseInt(id[0]) : id ? parseInt(id) : null;

    if (!documentId) {
      errors['global'] = { message: "ID do documento é inválido" };
      return res.status(400).json({ success: false, errors });
    }
    
    let doc: Document | null = null;
    try {
      doc = await getDocumentById(documentId);
    } catch(err) {
      console.error("Unexpected error while trying to get document:", err);
      errors['global'] = { message: "Não foi possível encontrar o documento" };
      res.status(500).json({ success: false, errors });
    }

    if (!doc) {
      errors['global'] = { message: "Documento não encontrado" };
      return res.status(400).json({ success: false, errors });
    }

    if(!approved && doc.path) {
      const pathToDoc = path.join(process.cwd(), doc.path);
  
      fs.unlink(path.resolve(pathToDoc), (err) => {
        if (err) {
          console.error('Error deleting file or file was already deleted in another attempt', err);
        }
      });
    }

    try {
      await updateDocumentApproval(doc.id, approved ? 1 : 0);
      
      if(userEmail) {
        await sendEmail({
          type: approved ? "Document Approved" : "Document Rejected",
          recipient: userEmail,
          subject: approved ? "Documento Aprovado" : "Documento Rejeitado",
          html: approved ? `
            <h2 style="font-size:20px;font-weight:700;line-height:28px;color:black">Parabéns, um de seus documentos foi aprovado</h2>
            <p style="font-size:16px;font-weight:400;line-height:20px:color:grey;margin-top:10px">Para visualizar documentos pendentes e aprovados basta ir a nossa plataforma</p>
            <p style="margin-top:40px">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="font-size:14px;text-decoration:none;color:white;background-color:#212121;border-radius:8px;padding-top:8px;padding-bottom:8px;padding-left:14px;padding-right:14px" target="_blank">Ir ao site</a>
            </p>
          ` : `
            <h2 style="font-size:20px;font-weight:700;line-height:28px;color:black">Um de seus documentos foi rejeitado</h2>
            <p style="font-size:16px;font-weight:400;line-height:20px:color:grey;margin-top:10px">Mas não desanime, basta ir a nossa plataforma, identificar o documento e enviá-lo novamente, qualquer dúvida que tenha não hesite em entrar em contato</p>
            <p style="margin-top:40px">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="font-size:14px;text-decoration:none;color:white;background-color:#212121;border-radius:8px;padding-top:8px;padding-bottom:8px;padding-left:14px;padding-right:14px" target="_blank">Ir ao site</a>
            </p>
          `
        });
      }

      return res.status(200).json({ success: true, errors });
    } catch (error) {
      console.error("Unexpected error during file status update:", error);
      errors['global'] = { message: "Erro ao tentar atualizar status do documento" };
      res.status(500).json({ success: false, errors });
    }
  }

  if(req.method === "DELETE") {
    const errors: FormErrors = {};
    const { id } = req.query;
    const documentId = Array.isArray(id) ? parseInt(id[0]) : id ? parseInt(id) : null;

    if (!documentId) {
      errors['global'] = { message: "ID do documento é inválido" };
      return res.status(400).json({ success: false, errors });
    }

    let doc: Document | null = null;
    try {
      doc = await getDocumentById(documentId);
    } catch(err) {
      console.error("Unexpected error while trying to get document:", err);
      errors['global'] = { message: "Não foi possível encontrar o documento" };
      res.status(500).json({ success: false, errors });
    }

    if (!doc) {
      errors['global'] = { message: "Documento não encontrado" };
      return res.status(400).json({ success: false, errors });
    }

    if(doc.path) {
      const pathToDoc = path.join(process.cwd(), doc.path);
  
      fs.unlink(path.resolve(pathToDoc), (err) => {
        if (err) {
          console.error('Error deleting file or file was already deleted in another attempt', err);
        }
      });
    }

    try {
      await deleteDocument(doc.id);
      return res.status(200).json({ success: true, errors });
    } catch (err) {
      console.error("Unexpected error while trying to delete document:", err);
      errors['global'] = { message: "Erro ao tentar deletar o documento" };
      return res.status(500).json({ success: false, errors });
    }
  }
}
