import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { queryDb } from '@/lib/db';
import User from '@/types/user';

/**
 * GET - Buscar todos os usuários com paginação e filtro
 */
export async function getAllUsers(page: number, search: string, searchBy: string, limit: number, sort: string, role?: string) {
  if (search && !['name', 'cpf'].includes(searchBy)) {
    throw new Error("Invalid searchBy parameter");
  }

  const offset = (page - 1) * limit;
  const values: any[] = [];

  const targetRole = role || "user";
  let query = `SELECT * FROM users WHERE role = ?`;
  values.push(targetRole);

  if (search) {
    query += ` AND (${searchBy === 'name' ? 'CONCAT(first_name, " ", last_name) LIKE ?' : 'cpf LIKE ?'})`;
    values.push(`%${search}%`);
  }

  query += ' LIMIT ? OFFSET ?';
  values.push(limit, offset);

  const rows = await queryDb<RowDataPacket[]>(query, values);
  return (rows || []) as User[];
}

export async function getTotalUsers(role?: string): Promise<number> {
  const targetRole = role || "user";
  const query = 'SELECT COUNT(*) AS count FROM users WHERE role = ?';
  const rows = await queryDb<RowDataPacket[]>(query, [targetRole]);
  return rows?.[0]?.count || 0;
}

export async function getUserById(userId: string): Promise<User | null> {
  const rows = await queryDb<RowDataPacket[]>('SELECT * FROM users WHERE id = ?', [userId]);
  return rows?.[0] as User ?? null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const rows = await queryDb<RowDataPacket[]>('SELECT * FROM users WHERE email = ?', [email]);
  return rows?.[0] as User ?? null;
}

export async function getUserByCpf(cpf: string): Promise<User | null> {
  const rows = await queryDb<RowDataPacket[]>('SELECT * FROM users WHERE cpf = ?', [cpf]);
  return rows?.[0] as User ?? null;
}

export async function getUserByRg(rg: string): Promise<User | null> {
  const rows = await queryDb<RowDataPacket[]>('SELECT * FROM users WHERE rg = ?', [rg]);
  return rows?.[0] as User ?? null;
}

export async function getUserOtp(email: string): Promise<{ otp: string; otpExpiry: Date } | null> {
  const rows = await queryDb<RowDataPacket[]>(
    'SELECT otp, otp_expiry as otpExpiry FROM users WHERE email = ?',
    [email]
  );
  return (rows?.[0] as { otp: string; otpExpiry: Date }) || null;
}

/**
 * POST - Criar novo usuário
 */
export async function createUser(email: string, phone: string): Promise<User> {
  const insert = await queryDb<ResultSetHeader>(
    'INSERT INTO users (email, phone) VALUES (?, ?)',
    [email, phone]
  );

  if (!insert.insertId) {
    throw new Error('Erro: Falha ao criar novo usuário.');
  }

  const rows = await queryDb<RowDataPacket[]>(
    'SELECT * FROM users WHERE id = ?',
    [insert.insertId]
  );

  return rows?.[0] as User;
}

/**
 * POST - Criar usuário administrador
 */
export async function createAdminUser(userData: {
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'user';
  super_admin: boolean;
  customer_id: string;
  status: string;
  register_completed: number;
}): Promise<User> {
  const {
    email,
    phone,
    first_name,
    last_name,
    role,
    super_admin,
    customer_id,
    status,
    register_completed
  } = userData;

  // Mapear status para os valores corretos do banco
  const dbStatus = status === 'active' ? 'ACTIVE' : status === 'inactive' ? 'SUSPENDED' : 'PENDING';

  const insert = await queryDb<ResultSetHeader>(
    `INSERT INTO users (
      email, phone, first_name, last_name, role, super_admin, customer_id, 
      status, register_completed, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [email, phone, first_name, last_name, role, super_admin ? 1 : 0, customer_id, dbStatus, register_completed]
  );

  if (!insert.insertId) {
    throw new Error('Erro: Falha ao criar novo usuário administrador.');
  }

  const rows = await queryDb<RowDataPacket[]>(
    'SELECT * FROM users WHERE id = ?',
    [insert.insertId]
  );

  return rows?.[0] as User;
}

/**
 * UPDATE - Completar cadastro do usuário
 */
export async function completeRegister(...args: Parameters<typeof _completeRegister>) {
  return _completeRegister(...args);
}

async function _completeRegister(
  customer_id: string,
  first_name: string,
  last_name: string,
  birth_date: string,
  rg: string,
  cpf: string,
  marital_status: string,
  nationality: string,
  profession: string,
  email: string,
  phone: string,
  street_address: string,
  address_number: string,
  neighbourhood: string,
  city: string,
  postal_code: string,
  state: string
): Promise<boolean> {
  const updateQuery = `
    UPDATE users SET
      customer_id = ?, first_name = ?, last_name = ?, birth_date = ?, rg = ?, cpf = ?,
      marital_status = ?, nationality = ?, profession = ?, phone = ?,
      street_address = ?, address_number = ?, neighbourhood = ?, city = ?, postal_code = ?, state = ?
    WHERE email = ?
  `;

  const updateValues = [
    customer_id, first_name, last_name, birth_date, rg, cpf, marital_status,
    nationality, profession, phone, street_address, address_number,
    neighbourhood, city, postal_code, state, email
  ];

  const update = await queryDb<ResultSetHeader>(updateQuery, updateValues);

  if (update.affectedRows === 0) {
    throw new Error('Erro: Nenhum usuário encontrado com esse email.');
  }

  const [verify] = await queryDb<RowDataPacket[]>(`
    SELECT CASE WHEN
      customer_id != '' AND first_name != '' AND last_name != '' AND birth_date IS NOT NULL AND
      rg != '' AND cpf != '' AND marital_status != '' AND nationality != '' AND profession != '' AND
      email != '' AND phone != '' AND street_address != '' AND address_number != '' AND
      neighbourhood != '' AND city != '' AND postal_code != '' AND state != ''
    THEN TRUE ELSE FALSE END AS result
    FROM users WHERE email = ?
  `, [email]);

  if (!verify?.result) {
    throw new Error('Erro: Cadastro incompleto.');
  }

  const finalUpdate = await queryDb<ResultSetHeader>(
    'UPDATE users SET register_completed = ? WHERE email = ?',
    [verify.result, email]
  );

  if (finalUpdate.affectedRows === 0) {
    throw new Error('Erro: Falha ao marcar cadastro como completo.');
  }

  return true;
}

/**
 * UPDATEs diversos
 */
export async function updatePersonalData(email: string, marital_status: string, profession: string): Promise<boolean> {
  const result = await queryDb<ResultSetHeader>(
    'UPDATE users SET marital_status = ?, profession = ? WHERE email = ?',
    [marital_status, profession, email]
  );

  if (result.affectedRows === 0) throw new Error('Usuário não encontrado.');
  return true;
}

export async function updateContacts(email: string, phone: string): Promise<boolean> {
  const result = await queryDb<ResultSetHeader>(
    'UPDATE users SET phone = ? WHERE email = ?',
    [phone, email]
  );

  if (result.affectedRows === 0) throw new Error('Usuário não encontrado.');
  return true;
}

export async function updateAddress(email: string, street: string, number: string, neigh: string, city: string, postal: string, state: string): Promise<boolean> {
  const result = await queryDb<ResultSetHeader>(
    'UPDATE users SET street_address = ?, address_number = ?, neighbourhood = ?, city = ?, postal_code = ?, state = ? WHERE email = ?',
    [street, number, neigh, city, postal, state, email]
  );

  if (result.affectedRows === 0) throw new Error('Usuário não encontrado.');
  return true;
}

export async function updateUserOtp(email: string, otp: string, otpExpiry: Date): Promise<boolean> {
  const result = await queryDb<ResultSetHeader>(
    'UPDATE users SET otp = ?, otp_expiry = ? WHERE email = ?',
    [otp, otpExpiry, email]
  );

  if (result.affectedRows === 0) throw new Error('Usuário não encontrado.');
  return true;
}

export async function invalidateOtp(email: string): Promise<boolean> {
  const result = await queryDb<ResultSetHeader>(
    'UPDATE users SET otp = NULL, otp_expiry = NULL WHERE email = ?',
    [email]
  );

  if (result.affectedRows === 0) throw new Error('Usuário não encontrado.');
  return true;
}

export async function updateUserPaymentMethod(userId: string, method: string): Promise<boolean> {
  const result = await queryDb<ResultSetHeader>(
    'UPDATE users SET payment_method = ? WHERE id = ?',
    [method, userId]
  );

  if (result.affectedRows === 0) throw new Error('Usuário não encontrado.');
  return true;
}

export async function updateUserStatus(customer_id: string, status: string): Promise<boolean> {
  const result = await queryDb<ResultSetHeader>(
    'UPDATE users SET status = ? WHERE customer_id = ?',
    [status, customer_id]
  );

  if (result.affectedRows === 0) throw new Error('Usuário não encontrado.');
  return true;
}

/**
 * UPDATE - Atualizar dados do usuário
 */
export async function updateUser(userId: number | string, updateData: Partial<User>): Promise<User | null> {
  const fields = Object.keys(updateData).filter(key => updateData[key as keyof User] !== undefined);
  
  if (fields.length === 0) {
    throw new Error('Nenhum campo para atualizar foi fornecido.');
  }

  const setClause = fields.map(field => `${field} = ?`).join(', ');
  const values = fields.map(field => updateData[field as keyof User]);
  values.push(userId);

  const result = await queryDb<ResultSetHeader>(
    `UPDATE users SET ${setClause} WHERE id = ?`,
    values
  );

  if (result.affectedRows === 0) {
    return null;
  }

  const rows = await queryDb<RowDataPacket[]>(
    'SELECT * FROM users WHERE id = ?',
    [userId]
  );

  return rows?.[0] as User ?? null;
}

/**
 * DELETE - Excluir usuário
 */
export async function deleteUser(user_id: number | string): Promise<boolean> {
  const result = await queryDb<ResultSetHeader>(
    'DELETE FROM users WHERE id = ?',
    [user_id]
  );

  if (result.affectedRows === 0) throw new Error('Usuário não encontrado.');
  return true;
}
