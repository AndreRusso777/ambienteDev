import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { queryDb } from './db';
import { Document } from '@/types/document';

/**
 * GET - Buscar todos documentos do usuário
 */
export async function getDocuments(user_id: number): Promise<Document[]> {
  const rows = await queryDb<RowDataPacket[]>(
    'SELECT * FROM documents WHERE user_id = ?',
    [user_id]
  );

  return (rows || []) as Document[];
}

/**
 * GET - Buscar documento por ID
 */
export async function getDocumentById(document_id: number): Promise<Document | null> {
  const rows = await queryDb<RowDataPacket[]>(
    'SELECT * FROM documents WHERE id = ?',
    [document_id]
  );

  return rows?.[0] as Document ?? null;
}

/**
 * GET - Buscar documento por tipo
 */
export async function getDocumentByType(user_id: number, type: string): Promise<Document | null> {
  const rows = await queryDb<RowDataPacket[]>(
    'SELECT * FROM documents WHERE type = ? AND user_id = ?',
    [type, user_id]
  );

  return rows?.[0] as Document ?? null;
}

/**
 * POST - Criar novo documento
 */
export async function createDocument(
  user_id: number,
  type: 'contract' | 'poa' | 'doc' | 'tax' | 'hipo',
  title: string,
  token: string | null = null,
  token_expiry: string | null = null,
  signer_token: string | null = null
): Promise<Document> {
  const insertQuery = `
    INSERT INTO documents (user_id, type, title, token, token_expiry, signer_token) 
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  const insertValues = [user_id, type, title, token, token_expiry, signer_token];

  const result = await queryDb<ResultSetHeader>(insertQuery, insertValues);

  if (!result.insertId) {
    throw new Error('Erro: Falha ao criar novo documento.');
  }

  const rows = await queryDb<RowDataPacket[]>(
    'SELECT * FROM documents WHERE id = ?', 
    [result.insertId]
  );

  return rows?.[0] as Document;
}

/**
 * POST - Criar documento aprovado com arquivo (usado para solicitações aprovadas)
 */
export async function createApprovedDocumentWithFile(
  user_id: number,
  title: string,
  filename: string,
  filepath: string,
  mime: string,
  size: number
): Promise<Document> {
  const insertQuery = `
    INSERT INTO documents (user_id, type, title, filename, path, mime, size, approved) 
    VALUES (?, 'doc', ?, ?, ?, ?, ?, 1)
  `;

  const insertValues = [user_id, title, filename, filepath, mime, size];

  const result = await queryDb<ResultSetHeader>(insertQuery, insertValues);

  if (!result.insertId) {
    throw new Error('Erro: Falha ao criar novo documento aprovado.');
  }

  const rows = await queryDb<RowDataPacket[]>(
    'SELECT * FROM documents WHERE id = ?', 
    [result.insertId]
  );

  return rows?.[0] as Document;
}

/**
 * PUT - Atualizar arquivo do documento
 */
export async function updateDocumentFile(
  id: number,
  user_id: number,
  filename: string,
  path: string,
  mime: string,
  size: number
): Promise<boolean> {
  const updateQuery = `
    UPDATE documents SET filename = ?, path = ?, mime = ?, size = ? 
    WHERE id = ? AND user_id = ?
  `;

  const result = await queryDb<ResultSetHeader>(
    updateQuery,
    [filename, path, mime, size, id, user_id]
  );

  if (result.affectedRows === 0) {
    throw new Error('Erro: Nenhum documento encontrado com esse ID e user ID.');
  }

  return true;
}

/**
 * PUT - Atualizar aprovação
 */
export async function updateDocumentApproval(id: number, approved: number): Promise<boolean> {
  let query = 'UPDATE documents SET approved = ?';
  const values: any[] = [approved];

  if (approved === 0) {
    query += ', filename = ?, path = ?, mime = ?, size = ?';
    values.push(null, null, null, null);
  }

  query += ' WHERE id = ?';
  values.push(id);

  const result = await queryDb<ResultSetHeader>(query, values);

  if (result.affectedRows === 0) {
    throw new Error('Erro: Nenhum documento encontrado com esse ID.');
  }

  return true;
}

/**
 * PUT - Atualizar token de assinatura
 */
export async function updateDocumentToken(id: number, token: string, token_expiry: string): Promise<Document> {
  const result = await queryDb<ResultSetHeader>(
    'UPDATE documents SET token = ?, token_expiry = ? WHERE id = ?',
    [token, token_expiry, id]
  );

  if (result.affectedRows === 0) {
    throw new Error('Erro: Nenhum documento encontrado com esse ID.');
  }

  const rows = await queryDb<RowDataPacket[]>(
    'SELECT * FROM documents WHERE id = ?',
    [id]
  );

  return rows?.[0] as Document;
}

/**
 * PUT - Atualizar token de assinatura com signer_token
 */
export async function updateDocumentTokenWithSigner(id: number, token: string, token_expiry: string, signer_token: string): Promise<Document> {
  const result = await queryDb<ResultSetHeader>(
    'UPDATE documents SET token = ?, token_expiry = ?, signer_token = ? WHERE id = ?',
    [token, token_expiry, signer_token, id]
  );

  if (result.affectedRows === 0) {
    throw new Error('Erro: Nenhum documento encontrado com esse ID.');
  }

  const rows = await queryDb<RowDataPacket[]>(
    'SELECT * FROM documents WHERE id = ?',
    [id]
  );

  return rows?.[0] as Document;
}

/**
 * PUT - Atualizar status de assinatura
 */
export async function updateDocumentSignStatus(documentToken: string) {  
  const result = await queryDb<ResultSetHeader>(
    "UPDATE documents SET signed = 1 WHERE token = ?",
    [documentToken]
  );
    
  return result;
}

/**
 * PUT - Verificar status no ZapSign e atualizar se assinado
 */
export async function checkAndUpdateDocumentSignStatus(documentToken: string): Promise<boolean> {
  try {    
    // Consultar o ZapSign para verificar o status
    const response = await fetch(`${process.env.ZAP_SIGN_API_URL}/docs/${documentToken}`, {
      method: 'GET',
      headers: {
        "Authorization": `Bearer ${process.env.ZAP_SIGN_API_TOKEN}`
      },
    });

    if (!response.ok) {
      console.error('Erro ao consultar ZapSign:', response.status);
      return false;
    }

    const data = await response.json();

    // Verificar se o documento foi assinado (status "signed" ou signers com signed_at preenchido)
    const isDocumentSigned = data.status === 'signed' || 
                            data.signers?.some((signer: any) => signer.signed_at !== null);

    if (isDocumentSigned) {      
      // Atualizar o banco de dados
      const result = await queryDb<ResultSetHeader>(
        "UPDATE documents SET signed = 1 WHERE token = ? AND signed = 0",
        [documentToken]
      );
            
      return result.affectedRows > 0;
    } else {
      return false;
    }
    
  } catch (error) {
    console.error('Erro ao verificar status de assinatura:', error);
    return false;
  }
}

/**
 * PUT - Resetar token do documento
 */
export async function resetDocumentToken(token: string): Promise<boolean> {
  const result = await queryDb<ResultSetHeader>(
    'UPDATE documents SET token = ?, token_expiry = ? WHERE token = ?',
    [null, null, token]
  );

  if (result.affectedRows === 0) {
    throw new Error('Erro: Nenhum documento encontrado para esse token.');
  }

  return true;
}

/**
 * DELETE - Excluir documento por ID
 */
export async function deleteDocument(id: number): Promise<boolean> {
  const result = await queryDb<ResultSetHeader>(
    'DELETE FROM documents WHERE id = ?',
    [id]
  );

  if (result.affectedRows === 0) {
    throw new Error('Erro: Nenhum documento encontrado com o ID informado.');
  }

  return true;
}

/**
 * DELETE - Excluir todos documentos do usuário
 */
export async function deleteUserDocuments(user_id: number | string): Promise<boolean> {
  await queryDb<ResultSetHeader>(
    'DELETE FROM documents WHERE user_id = ?',
    [user_id]
  );

  return true;
}
