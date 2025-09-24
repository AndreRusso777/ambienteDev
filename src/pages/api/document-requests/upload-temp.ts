import { NextApiRequest, NextApiResponse } from "next";
import formidable, { Fields, Files } from "formidable";
import fs from "fs";
import path from "path";
import { updateDocumentRequestWithFile } from "@/lib/document-requests";

export const config = {
  api: {
    bodyParser: false,
    responseLimit: "25mb"
  },
};

interface FileMetadata {
  requestId: number;
  userId: number;
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
    fs.mkdirSync(fileUploadDir, { recursive: true });
  }

  const form = formidable({
    uploadDir: fileUploadDir,
    keepExtensions: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowEmptyFiles: false,
    filter: (part) => {
      return part.name === 'file' && (
        part.mimetype?.includes('pdf') ||
        part.mimetype?.includes('png') ||
        part.mimetype?.includes('jpg') ||
        part.mimetype?.includes('jpeg')
      ) || false;
    }
  });

  try {
    const { fields, files } = await parseForm(req, form);

    const userId = fields.userId && fields.userId[0];
    const requestId = fields.requestId && fields.requestId[0];
    const documentType = fields.documentType && fields.documentType[0];

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        errors: { global: { message: "Usuário não reconhecido, se o problema persistir entre em contato com o suporte" } } 
      });
    }

    if (!requestId) {
      return res.status(400).json({ 
        success: false, 
        errors: { global: { message: "ID da solicitação é obrigatório" } } 
      });
    }

    if (!documentType) {
      return res.status(400).json({ 
        success: false, 
        errors: { global: { message: "Tipo de documento é obrigatório" } } 
      });
    }

    /**
     * Create user-specific folder if it doesn't exist
     */
    const userFolderName = userId;
    const userUploadDir = path.join(fileUploadDir, userFolderName);

    if (!fs.existsSync(userUploadDir)) {
      fs.mkdirSync(userUploadDir, { recursive: true });
    }

    /**
     * Create temp folder inside user's directory
     */
    const userTempDir = path.join(userUploadDir, 'temp');
    if (!fs.existsSync(userTempDir)) {
      fs.mkdirSync(userTempDir, { recursive: true });
    }

    const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!uploadedFile) {
      return res.status(400).json({ 
        success: false, 
        errors: { global: { message: "O arquivo não pôde ser salvo, se o problema persistir entre em contato com o suporte" } } 
      });
    }

    /**
     * Generate unique filename and move to temp directory
     */
    const timestamp = Date.now();
    const fileExtension = path.extname(uploadedFile.originalFilename || '');
    const newFileName = `${documentType}_${requestId}_${timestamp}${fileExtension}`;
    const oldPath = uploadedFile.filepath;
    const newPath = path.join(userTempDir, newFileName);
    
    fs.renameSync(oldPath, newPath);

    /**
     * Prepare metadata for saving in the database
     */
    const fileMetadata: FileMetadata = {
      requestId: parseInt(requestId),
      userId: parseInt(userId),
      filename: newFileName,
      path: newPath.replace(process.cwd(), ''),
      mime: uploadedFile.mimetype as string,
      size: uploadedFile.size,
    };

    /**
     * Save document request metadata in the database
     */
    try { 
      await updateDocumentRequestWithFile(
        fileMetadata.requestId,
        fileMetadata.path,
        fileMetadata.filename,
        fileMetadata.size,
        fileMetadata.mime
      );
    } catch (dbError) {
      console.error("Erro ao atualizar solicitação:", dbError);
      // Se der erro no banco, remover arquivo para evitar inconsistência
      if (fs.existsSync(newPath)) {
        fs.unlinkSync(newPath);
      }
      return res.status(500).json({
        success: false,
        errors: { global: { message: "Erro ao registrar arquivo na solicitação" } }
      });
    }

    return res.status(200).json({
      success: true,
      message: "Arquivo enviado com sucesso",
      data: fileMetadata,
    });
  } catch (error) {
    console.error("Erro no upload:", error);
    return res.status(500).json({
      success: false,
      errors: { global: { message: "Erro interno do servidor" } }
    });
  }
}
