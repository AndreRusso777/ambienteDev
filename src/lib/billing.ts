import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { queryDb } from './db';
import Billing from '@/types/billing';

/**
 * GET - Buscar billing por ID de usuário
 */
export async function getBillingByUserId(user_id: number): Promise<Billing | null> {
  const rows = await queryDb<RowDataPacket[]>(
    'SELECT * FROM billings WHERE user_id = ?', 
    [user_id]
  );

  if (!rows?.length) return null;

  return rows[0] as Billing;
}

/**
 * POST - Criar um novo billing
 */
export async function createBilling(
  user_id: number,
  price: number,
  price_text: string,
  down_payment: number,
  down_payment_text: number,
  billing_type: number,
  installment_count: number
): Promise<Billing> {
  const insertQuery = `
    INSERT INTO billings
      (user_id, price, price_text, down_payment, down_payment_text, billing_type, installment_count)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  const values: any[] = [
    user_id,
    price,
    price_text,
    down_payment,
    down_payment_text,
    billing_type,
    installment_count,
  ];

  const result = await queryDb<ResultSetHeader>(insertQuery, values);

  if (!result.insertId) {
    throw new Error('Erro: Falha ao criar novo billing.');
  }

  const rows = await queryDb<RowDataPacket[]>(
    'SELECT * FROM billings WHERE id = ?', 
    [result.insertId]
  );

  if (!rows?.length) {
    throw new Error('Erro: Não foi possível buscar o billing recém-criado.');
  }

  return rows[0] as Billing;
}

/**
 * DELETE - Excluir billing de um usuário
 */
export async function deleteUserBilling(user_id: number | string): Promise<boolean> {
  await queryDb<ResultSetHeader>(
    'DELETE FROM billings WHERE user_id = ?', 
    [user_id]
  );

  return true;
}
