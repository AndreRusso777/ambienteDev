import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { queryDb } from '@/lib/db';
import Payment from '@/types/payments';

/**
 * GET - Buscar pagamento por payment_id
 */
export async function getPayment(payment_id: string | number): Promise<Payment | null> {
  const rows = await queryDb<RowDataPacket[]>(
    'SELECT * FROM payments WHERE payment_id = ?',
    [payment_id]
  );

  return rows?.[0] as Payment ?? null;
}

/**
 * GET - Buscar pagamento por usuário
 */
export async function getPaymentForUser(user_id: string | number): Promise<Payment | null> {
  const rows = await queryDb<RowDataPacket[]>(
    'SELECT * FROM payments WHERE user_id = ?',
    [user_id]
  );

  return rows?.[0] as Payment ?? null;
}

/**
 * POST - Criar pagamento
 */
export async function createPayment(
  user_id: number,
  payment_id: string,
  status: string,
  invoice_url: string
): Promise<Payment> {
  const insertQuery = `
    INSERT INTO payments (user_id, payment_id, status, invoice_url)
    VALUES (?, ?, ?, ?)
  `;

  const insertValues = [user_id, payment_id, status, invoice_url];

  const result = await queryDb<ResultSetHeader>(insertQuery, insertValues);

  if (!result.insertId) {
    throw new Error('Erro: Falha ao inserir pagamento no banco.');
  }

  const rows = await queryDb<RowDataPacket[]>(
    'SELECT * FROM payments WHERE id = ?',
    [result.insertId]
  );

  if (!rows?.length) {
    throw new Error('Erro: Não foi possível recuperar o pagamento recém-criado.');
  }

  return rows[0] as Payment;
}

/**
 * UPDATE - Atualizar status do pagamento
 */
export async function updatePaymentStatus(
  payment_id: string,
  status: string
): Promise<boolean> {
  const result = await queryDb<ResultSetHeader>(
    'UPDATE payments SET status = ? WHERE payment_id = ?',
    [status, payment_id]
  );

  if (result.affectedRows === 0) {
    throw new Error('Erro: Nenhum pagamento encontrado com esse ID.');
  }

  return true;
}

/**
 * DELETE - Excluir todos os pagamentos de um usuário
 */
export async function deleteUserPayments(user_id: number | string): Promise<boolean> {
  await queryDb<ResultSetHeader>(
    'DELETE FROM payments WHERE user_id = ?',
    [user_id]
  );

  return true;
}
