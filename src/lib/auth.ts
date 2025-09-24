import { cookies } from 'next/headers';
import { queryDb } from './db';
import crypto from 'crypto';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface Session {
  id: string;
  userId: number;
  expiresAt: Date;
}

export interface SessionUser {
  id: number;
  email: string;
  role: 'admin' | 'user';
  super_admin: number;
  register_completed: boolean;
  suspended: boolean;
}

export interface SessionValidationResult {
  session: Session | null;
}

/**
 * Cria uma nova sessão
 */
export async function createSession(userId: number): Promise<Session> {
  if (!Number.isInteger(userId)) {
    throw new Error('Invalid user ID');
  }

  const sessionId = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14); // 14 dias

  const session: Session = {
    id: sessionId,
    userId,
    expiresAt
  };

  try {
    await queryDb<ResultSetHeader>(
      'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)',
      [session.id, session.userId, session.expiresAt]
    );
    return session;
  } catch (err) {
    console.error('Erro ao criar sessão:', err);
    throw new Error('Error while trying to create session.');
  }
}

/**
 * Valida uma sessão existente
 */
export async function validateSession(sessionId: string | null | undefined): Promise<SessionValidationResult> {
  if (!sessionId) {
    return { session: null };
  }

  const query = `
    SELECT 
        sessions.id AS sessionId, 
        sessions.user_id AS userId, 
        sessions.expires_at AS expiresAt, 
        users.email, 
        users.role, 
        users.super_admin,
        users.register_completed, 
        users.status
    FROM 
        sessions
    INNER JOIN 
        users ON sessions.user_id = users.id
    WHERE 
        sessions.id = ?
  `;

  try {
    const rows = await queryDb<RowDataPacket[]>(query, [sessionId]);

    if (!rows?.length) {
      return { session: null };
    }

    const session: Session = {
      id: rows[0].sessionId,
      userId: rows[0].userId,
      expiresAt: new Date(rows[0].expiresAt)
    };

    const now = Date.now();
    const expTime = session.expiresAt.getTime();

    if (now >= expTime) {
      await queryDb('DELETE FROM sessions WHERE id = ?', [session.id]);
      return { session: null };
    }

    // Sessão expira em menos de 7 dias → estende por mais 14 dias
    if (now >= expTime - 1000 * 60 * 60 * 24 * 7) {
      session.expiresAt = new Date(now + 1000 * 60 * 60 * 24 * 14);
      await queryDb('UPDATE sessions SET expires_at = ? WHERE id = ?', [session.expiresAt, session.id]);
    }

    return { session };
  } catch (err) {
    console.error('Erro ao validar sessão:', err);
    throw err;
  }
}

/**
 * Destroi uma sessão pelo ID
 */
export async function destroySession(sessionId: string) {
  try {
    await queryDb('DELETE FROM sessions WHERE id = ?', [sessionId]);
  } catch (err) {
    console.error('Erro ao destruir sessão:', err);
    throw new Error('Error while trying to destroy session.');
  }
}
