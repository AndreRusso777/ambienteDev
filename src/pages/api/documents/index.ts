import { createDocument, getDocumentByType, getDocuments, checkAndUpdateDocumentSignStatus } from "@/lib/documents";
import sendEmail from "@/lib/email";
import { FormErrors } from "@/types/form";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "PUT" || req.method === "DELETE") {
    res.setHeader("Allow", ["POST", "GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const apiToken = (req.headers.authorization || '').split("Bearer ").at(1);
  if (!apiToken || apiToken !== process.env.NEXT_PUBLIC_API_TOKEN) {
    return res.status(403).json({ success: false, errors: {} });
  }

  if(req.method === "GET") {
    const errors: FormErrors = {};
    const userId = parseInt(req.query.userId as string) || null;  

    if(!userId) {
      errors['global'] = { message: "Não foi possível buscar documentos para este usuário" };
      return res.status(400).json({ success: false, errors });
    }

    const type: string = (Array.isArray(req.query.type) ? req.query.type[0] : req.query.type) || "";
    
    if(!type) {
      try {
        const documents = await getDocuments(userId);
        
        const documentsToCheck = documents.filter(doc => 
          doc.token && 
          doc.signed === 0 && 
          (doc.type === 'contract' || doc.type === 'poa' || doc.type === 'tax' || doc.type === 'hipo')
        );
        
        for (const doc of documentsToCheck) {
          try {
            await checkAndUpdateDocumentSignStatus(doc.token);
          } catch (error) {
            console.error(`Erro ao verificar documento ${doc.token}:`, error);
          }
        }
        
        const updatedDocuments = await getDocuments(userId);
        
        return res.status(200).json({ success: true, errors, data: { documents: updatedDocuments }});
      } catch (error) {
        console.error("Unexpected error while trying to get documents:", error);
        errors['global'] = { message: "Erro ao tentar buscar os documentos do usuário, tente novamente" };
        res.status(500).json({ success: false, errors });
      }
    } else {
      try {
        const document = await getDocumentByType(userId, type);
        return res.status(200).json({ success: true, errors, data: { document }});
      } catch (error) {
        console.error("Unexpected error while trying to get documents by document type:", error);
        errors['global'] = { message: "Erro ao tentar buscar documento por tipo, tente novamente" };
        res.status(500).json({ success: false, errors });
      }
    }
  }

  if(req.method === "POST") {
    const errors: FormErrors = {};
    const { userId, userEmail, type, title } = req.body;

    if(!type) {
      errors['global'] = { message: "Não é possível adicionar um documento sem um tipo" };
      return res.status(400).json({ success: false, errors });
    }

    if(!title) {
      errors['global'] = { message: "Não é possível adicionar um documento sem título" };
      return res.status(400).json({ success: false, errors });
    }

    if(!userId) {
      errors['global'] = { message: "ID do usuário não encontrado" };
      return res.status(400).json({ success: false, errors });
    }

    try {
      const document = await createDocument(userId, type || 'doc', title);

      if(userEmail) {
        await sendEmail({
          type: "Nova requisição de Documento",
          recipient: userEmail,
          subject: "Nova requisição de Documento",
          html: `
            <h2 style="font-size:20px;font-weight:700;line-height:28px;color:black;padding-top:16px;padding-bottom:16px;margin-bottom:0">Nova requisição de documento</h2>
            <ul style="margin-top:14px;margin-bottom:0;padding-left:16px">
              <li>
                <span class="font-weight:700;font-size:16px">Documento:</span>
                <span class="font-weight:400;font-size:16px">${document.title}</span>
              </li>
              <li>
                <span class="font-weight:700;font-size:16px">Status:</span>
                <span class="font-weight:400;font-size:16px">Pendente</span>
              </li>
            </ul>
            <p style="margin-top:40px">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="font-size:14px;text-decoration:none;color:white;background-color:#212121;border-radius:8px;padding-top:8px;padding-bottom:8px;padding-left:14px;padding-right:14px" target="_blank">Ir ao site</a>
            </p>
          `
        });
      }

      return res.status(200).json({ success: true, message: 'Documento adicionado com sucesso!', errors, data: { document }});
    } catch (error) {
      console.error("Unexpected error during file upload:", error);
      errors['global'] = { message: "Erro ao tentar criar novo documento, tente novamente" };
      res.status(500).json({ success: false, errors });
    }
  }
}
