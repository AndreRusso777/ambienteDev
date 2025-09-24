import { NextApiRequest, NextApiResponse } from "next";
import formidable, { Fields, Files } from "formidable";
import fs from 'fs';
import path from "path";
import { updateDocumentFile } from "@/lib/documents";

export const config = {
  api: {
    bodyParser: false,
    responseLimit: "25mb"
  },
};

interface FileMetadata {
  id: number;
  user_id: number;
  filename: string;
  path: string;
  mime: string;
  size: number;
}

/**
 * Formidable's async parse
 * @param req 
 * @param form 
 * @returns 
 */
const parseForm = (req: NextApiRequest, form: InstanceType<typeof formidable.IncomingForm>): Promise<{ fields: formidable.Fields; files: formidable.Files }> => {
  return new Promise((resolve, reject) => {
    form.parse(req, (err: Error | null, fields: Fields, files: Files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const apiToken = (req.headers.authorization || '').split("Bearer ").at(1);

  if (!apiToken || apiToken !== process.env.NEXT_PUBLIC_API_TOKEN) {
    return res.status(403).json({ success: false, errors: {} });
  }

  const fileUploadDir = path.join(process.cwd(), 'documents');
  if (!fs.existsSync(fileUploadDir)) {
    fs.mkdirSync(fileUploadDir);
  }

  const form = formidable({
    uploadDir: fileUploadDir,
    keepExtensions: true,
    maxFileSize: 20 * 1024 * 1024, // 5mb max
    allowEmptyFiles: true
  });

  try {
    const { fields, files } = await parseForm(req, form);

    const userId = fields.userId && fields.userId[0];
    if (!userId) {
      return res.status(400).json({ success: false, errors: { global: "Usuário não reconhecido, se o problema persistir entre em contato com o suporte" } });
    }

    /**
     * Create user-specific folder if it doesn't exist
     */
    const userFolderName = userId;
    const userUploadDir = path.join(fileUploadDir, userFolderName);

    if (!fs.existsSync(userUploadDir)) {
      fs.mkdirSync(userUploadDir);
    }

    const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!uploadedFile) {
      return res.status(400).json({ success: false, errors: { global: "O arquivo não pôde ser salvo, se o problema persistir entre em contato com o suporte" } });
    }

    /**
     * Move the uploaded file to the user's directory
     */
    const oldPath = uploadedFile.filepath;
    const newPath = path.join(userUploadDir, uploadedFile.newFilename);
    fs.renameSync(oldPath, newPath);

    /**
     * Prepare metadata for saving in the database
     */
    const documentId = fields.documentId && fields.documentId[0];
    if (!documentId) {
      return res.status(400).json({ success: false, errors: { global: "Erro ao tentar fazer upload do documento, tente novamente" } });
    }

    const fileMetadata: FileMetadata = {
      id: parseInt(documentId),
      user_id: parseInt(userId),
      filename: uploadedFile.newFilename,
      path: newPath.replace(process.cwd(), ''),
      mime: uploadedFile.mimetype as string,
      size: uploadedFile.size,
    };

    /**
     * Save document metadata in the database
     */
    try { 
      await updateDocumentFile(
        fileMetadata.id,
        fileMetadata.user_id,
        fileMetadata.filename,
        fileMetadata.path,
        fileMetadata.mime,
        fileMetadata.size
      );
    } catch(err) {
      console.error(err);
    }
    

    return res.status(200).json({
      success: true,
      message: "Documento salvo com sucesso",
      data: fileMetadata,
    });
  } catch (error) {
    console.error("Unexpected error during file upload:", error);
    res.status(500).json({ success: false, errors: { global: "Erro ao tentar fazer upload do documento, tente novamente" } });
  }
}
