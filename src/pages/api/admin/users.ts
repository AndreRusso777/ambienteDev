import { createAdminUser, getUserByEmail, updateUser, deleteUser, getAllUsers } from "@/lib/user";
import { FormErrors } from "@/types/form";
import User from "@/types/user";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const apiToken = (req.headers.authorization || '').split("Bearer ").at(1);

  if (!apiToken || apiToken !== process.env.NEXT_PUBLIC_API_TOKEN) {
    return res.status(403).json({ success: false, errors: {} });
  }

  if (req.method === "GET") {
    const errors: FormErrors = {};
    const role = req.query.role as string;

    try {
      // Se role especificado, filtrar por role
      let users: User[] = [];
      if (role) {
        users = await getAllUsers(1, "", "name", 100, "", role);
      } else {
        users = await getAllUsers(1, "", "name", 100, "");
      }

      return res.status(200).json({ 
        success: true, 
        errors, 
        data: { users } 
      });
    } catch (err) {
      console.error('Erro ao buscar usuários administradores', err);
      errors['global'] = { message: 'Erro ao buscar usuários' };
      return res.status(500).json({ success: false, errors });
    }
  }

  if (req.method === "POST") {
    const errors: FormErrors = {};
    const { 
      first_name, 
      last_name, 
      email, 
      phone, 
      role = 'admin',
      super_admin = false,
      customer_id,
      status = 'active',
      register_completed = 1
    } = req.body;

    // Validações básicas
    if (!first_name || first_name.trim().length < 2) {
      errors['first_name'] = { message: 'Nome deve ter pelo menos 2 caracteres' };
    }

    if (!last_name || last_name.trim().length < 2) {
      errors['last_name'] = { message: 'Sobrenome deve ter pelo menos 2 caracteres' };
    }

    if (!email || !email.includes('@')) {
      errors['email'] = { message: 'Email inválido' };
    }

    if (phone && phone.length < 10) {
      errors['phone'] = { message: 'Telefone inválido' };
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    // Verificar se email já existe
    try {
      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        errors['email'] = { message: 'Este email já está em uso' };
        return res.status(409).json({ success: false, errors });
      }
    } catch (err) {
      console.error('Erro ao verificar email existente', err);
      errors['global'] = { message: 'Erro ao verificar email' };
      return res.status(500).json({ success: false, errors });
    }

    // Criar novo usuário administrador
    try {
      const newUser = await createAdminUser({
        email,
        phone: phone || '',
        first_name,
        last_name,
        role,
        super_admin,
        customer_id: customer_id || `ADM_${Date.now()}`,
        status,
        register_completed
      });

      if (!newUser) {
        errors['global'] = { message: 'Erro ao criar usuário' };
        return res.status(500).json({ success: false, errors });
      }

      return res.status(201).json({ 
        success: true, 
        errors: {}, 
        data: { user: newUser } 
      });
    } catch (err) {
      console.error('Erro ao criar usuário administrador', err);
      errors['global'] = { message: 'Erro ao criar usuário' };
      return res.status(500).json({ success: false, errors });
    }
  }

  if (req.method === "PUT") {
    const errors: FormErrors = {};
    const { userId, ...updateData } = req.body;

    if (!userId) {
      errors['global'] = { message: 'ID do usuário é obrigatório' };
      return res.status(400).json({ success: false, errors });
    }

    try {
      const updatedUser = await updateUser(userId, updateData);
      
      if (!updatedUser) {
        errors['global'] = { message: 'Usuário não encontrado' };
        return res.status(404).json({ success: false, errors });
      }

      return res.status(200).json({ 
        success: true, 
        errors: {}, 
        data: { user: updatedUser } 
      });
    } catch (err) {
      console.error('Erro ao atualizar usuário', err);
      errors['global'] = { message: 'Erro ao atualizar usuário' };
      return res.status(500).json({ success: false, errors });
    }
  }

  res.setHeader("Allow", ["GET", "POST", "PUT"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
