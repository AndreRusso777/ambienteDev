import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { queryDb } from './db';
import { DocumentRequest } from '@/types/document-request';
import { NotificationManager } from './notifications';
import { notifyAdminsNewDocumentRequest } from './notification-helpers';

/**
 * GET - Lista de requisições por usuário
 */
export async function getDocumentRequests(user_id: number) {
  const rows = await queryDb<RowDataPacket[]>(
    `SELECT dr.*, u.first_name, u.last_name, u.email
     FROM document_requests dr
     JOIN users u ON dr.user_id = u.id
     WHERE dr.user_id = ? 
     ORDER BY dr.created_at DESC`,
    [user_id]
  );

  return (rows || []) as DocumentRequest[];
}

/**
 * GET - Todas as requisições com paginação e filtros
 */
export async function getAllDocumentRequestsOptimized(
  page = 1, 
  limit = 10,
  filters: {
    status?: string;
    sortBy?: 'newest' | 'oldest';
    clientName?: string;
    dateFrom?: string;
    dateTo?: string;
  } = {}
) {
  const offset = (page - 1) * limit;
  const whereClauses: string[] = [];
  const whereParams: any[] = [];
  
  if (filters.status && filters.status !== 'all') {
    whereClauses.push('dr.status = ?');
    whereParams.push(filters.status);
  }
  
  if (filters.clientName && filters.clientName.trim()) {
    whereClauses.push('(u.first_name LIKE ? OR u.last_name LIKE ? OR CONCAT(u.first_name, " ", u.last_name) LIKE ?)');
    const searchTerm = `%${filters.clientName.trim()}%`;
    whereParams.push(searchTerm, searchTerm, searchTerm);
  }
  
  if (filters.dateFrom) {
    whereClauses.push('DATE(dr.created_at) >= ?');
    whereParams.push(filters.dateFrom);
  }
  
  if (filters.dateTo) {
    whereClauses.push('DATE(dr.created_at) <= ?');
    whereParams.push(filters.dateTo);
  }
  
  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
  const orderBy = filters.sortBy === 'oldest' ? 'ASC' : 'DESC';
  
  const countQuery = `SELECT COUNT(*) as total 
     FROM document_requests dr
     JOIN users u ON dr.user_id = u.id
     ${whereClause}`;

  const countResult = await queryDb<RowDataPacket[]>(countQuery, whereParams);
  const totalRequests = (countResult[0] as any)?.total || 0;

  const selectQuery = `SELECT dr.*, u.first_name, u.last_name, u.email
     FROM document_requests dr
     JOIN users u ON dr.user_id = u.id
     ${whereClause}
     ORDER BY dr.created_at ${orderBy}
     LIMIT ? OFFSET ?`;
  
  const selectParams = [...whereParams, limit, offset];

  const rows = await queryDb<RowDataPacket[]>(selectQuery, selectParams);

  return {
    requests: (rows || []) as DocumentRequest[],
    totalRequests
  };
}

/**
 * GET - Requisição específica por ID
 */
export async function getDocumentRequestById(id: number) {
  const rows = await queryDb<RowDataPacket[]>(
    `SELECT dr.*, u.first_name, u.last_name, u.email
     FROM document_requests dr
     JOIN users u ON dr.user_id = u.id
     WHERE dr.id = ?`,
    [id]
  );

  return rows?.[0] as DocumentRequest ?? null;
}

/**
 * POST - Criar nova requisição
 */
export async function createDocumentRequest(
  user_id: number,
  title: string,
  message?: string,
  documentType?: string
) {
  const result = await queryDb<ResultSetHeader>(
    'INSERT INTO document_requests (user_id, title, message, document_type, status, has_attachment) VALUES (?, ?, ?, ?, ?, ?)',
    [user_id, title, message || null, documentType || null, 'pending', 0]
  );

  if (!result.insertId) {
    throw new Error('Erro ao criar requisição de documento.');
  }

  const rows = await queryDb<RowDataPacket[]>(
    'SELECT * FROM document_requests WHERE id = ?',
    [result.insertId]
  );

  const documentRequest = rows?.[0] as DocumentRequest;

  // Buscar dados do usuário que fez a solicitação
  const userRows = await queryDb<RowDataPacket[]>(
    'SELECT first_name, last_name, email FROM users WHERE id = ?',
    [user_id]
  );

  const user = userRows?.[0];
  const userName = user ? `${user.first_name} ${user.last_name}`.trim() : 'Usuário';

  // Criar e enviar notificação para todos os administradores
  try {
    await notifyAdminsNewDocumentRequest({
      id: result.insertId,
      title,
      document_type: documentType,
      user_id,
      user_name: userName,
      user_email: user?.email,
      message
    });
  } catch (error) {
    console.error('Erro ao criar notificação para administradores:', error);
    // Não falhar a criação da solicitação por erro na notificação
  }

  return documentRequest;
}

/**
 * PUT - Atualizar solicitação com informações do arquivo
 */
export async function updateDocumentRequestWithFile(
  requestId: number,
  filePath: string,
  fileName: string,
  fileSize: number,
  mimeType: string
) {
  const result = await queryDb<ResultSetHeader>(
    `UPDATE document_requests 
     SET file_path = ?, file_name = ?, file_size = ?, file_mime_type = ?, has_attachment = 1, updated_at = NOW()
     WHERE id = ?`,
    [filePath, fileName, fileSize, mimeType, requestId]
  );

  if (result.affectedRows === 0) {
    throw new Error('Erro: Nenhuma solicitação encontrada com este ID.');
  }

  return true;
}

/**
 * PUT - Aprovar solicitação e mover arquivo para pasta definitiva
 */
export async function approveDocumentRequestAndMoveFile(
  requestId: number,
  newFilePath: string,
  adminMessage?: string,
  respondedBy?: number,
  respondedByName?: string
) {
  const result = await queryDb<ResultSetHeader>(
    `UPDATE document_requests 
     SET status = 'completed', file_path = ?, admin_message = ?, responded_by = ?, responded_by_name = ?, responded_at = NOW(), updated_at = NOW()
     WHERE id = ?`,
    [newFilePath, adminMessage || null, respondedBy || null, respondedByName || null, requestId]
  );

  if (result.affectedRows === 0) {
    throw new Error('Erro: Nenhuma solicitação encontrada com este ID.');
  }

  return true;
}

/**
 * PUT - Atualizar status
 */
export async function updateRequestStatus(
  id: number,
  status: 'pending' | 'in_progress' | 'completed' | 'rejected',
  admin_message?: string,
  responded_by?: number,
  responded_by_name?: string
) {
  const result = await queryDb<ResultSetHeader>(
    `UPDATE document_requests 
     SET status = ?, admin_message = ?, responded_by = ?, responded_by_name = ?, responded_at = NOW() 
     WHERE id = ?`,
    [status, admin_message || null, responded_by || null, responded_by_name || null, id]
  );

  if (result.affectedRows === 0) {
    throw new Error('Erro: Nenhuma requisição encontrada com este ID.');
  }

  return true;
}

/**
 * Cache com 30s para detalhes de uma requisição
 */
const requestCache = new Map<number, { data: any; timestamp: number }>();
const CACHE_DURATION = 30 * 1000;

export async function getRequestDetailsWithCache(requestId: number) {
  const cached = requestCache.get(requestId);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  const rows = await queryDb<RowDataPacket[]>(
    `SELECT dr.*, u.first_name, u.last_name, u.email
     FROM document_requests dr
     JOIN users u ON dr.user_id = u.id
     WHERE dr.id = ?`,
    [requestId]
  );

  const result = { request: rows?.[0] || null };

  requestCache.set(requestId, { data: result, timestamp: Date.now() });
  return result;
}

export function invalidateRequestCache(requestId: number) {
  requestCache.delete(requestId);
}
