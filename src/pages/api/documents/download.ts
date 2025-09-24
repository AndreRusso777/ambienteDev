import { FormErrors } from "@/types/form";
import { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import fs from "fs";

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const apiToken = (req.headers.authorization || '').split("Bearer ").at(1);

  if (!apiToken || apiToken !== process.env.NEXT_PUBLIC_API_TOKEN) {
    return res.status(403).json({ success: false, errors: {} });
  }

  const errors: FormErrors = {};

  const token = req.query.token as string || null;

  if(token) {
    try {
      const response = await fetch(`${process.env.ZAP_SIGN_API_URL}/docs/${token}`, {
        method: 'GET',
        headers: {
          "Authorization": `Bearer ${process.env.ZAP_SIGN_API_TOKEN}`
        },
      });

      if(!response.ok) {
        errors['global'] = { message: "Ocorreu um erro ao tentar encontrar endereço do documento" };
        return res.status(400).json({ success: false, errors });
      }

      const data = await response.json();
      return res.status(200).json({ success: false, errors, data: { name: data.name, url: data.signed_file || data.original_file } })
    } catch(err) {
      console.error(err);
      errors['global'] = { message: "Ocorreu um erro em nosso sistema, por favor tente novamente" };
      return res.status(500).json({ success: false, errors });
    }
  }

  const filename = req.query.filename as string || null;
  const userId = parseInt(req.query.userId as string) || null;

  if(!filename) {
    errors['global'] = { message: "Documento inválido" };
    return res.status(400).json({ success: false, errors });
  }

  if(!userId) {
    errors['global'] = { message: "Não foi possível buscar documentos para este usuário" };
    return res.status(400).json({ success: false, errors });
  }

  // Return the document file
  const documentsDir = path.join(process.cwd(), 'documents');
  const filePath = path.join(documentsDir, `${userId}`, filename as string);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: "Documento não encontrado" });
  }

  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

  const fileStream = fs.createReadStream(filePath);

  fileStream.pipe(res);

  fileStream.on('end', () => {
    res.end();
  });

  fileStream.on('error', (err) => {
    return res.status(500).json({ success: false, message: "Erro ao tentar retornar documento" });
  });
} 