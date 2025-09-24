import { getDocumentRequestById } from "@/lib/document-requests";
import { FormErrors } from "@/types/form";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const apiToken = (req.headers.authorization || '').split("Bearer ").at(1);

  if (!apiToken || apiToken !== process.env.NEXT_PUBLIC_API_TOKEN) {
    return res.status(403).json({ success: false, errors: {} });
  }

  if (req.method === "GET") {
    const errors: FormErrors = {};
    const { id } = req.query;
    const requestId = Array.isArray(id) ? parseInt(id[0]) : parseInt(id as string);

    if (!requestId) {
      errors['global'] = { message: "ID da solicitação inválido" };
      return res.status(400).json({ success: false, errors });
    }

    try {
      const request = await getDocumentRequestById(requestId);
      
      if (!request) {
        errors['global'] = { message: "Solicitação não encontrada" };
        return res.status(404).json({ success: false, errors });
      }

      return res.status(200).json({ 
        success: true, 
        errors: {}, 
        data: { request } 
      });
    } catch (error) {
      console.error("Error while getting request details:", error);
      errors['global'] = { message: "Erro ao buscar detalhes da solicitação" };
      return res.status(500).json({ success: false, errors });
    }
  }

  res.setHeader("Allow", ["GET"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}