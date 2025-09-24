import { createUser, getUserByEmail, completeRegister, getUserByCpf, getUserByRg, updatePersonalData, updateContacts, updateAddress, getAllUsers, getTotalUsers, deleteUser } from "@/lib/user";
import { registerSchema, completeRegisterSchema, personalDataSchema, mobilePhoneSchema, addressSchema } from "@/schemas/user";
import { FormErrors } from "@/types/form";
import User from "@/types/user";
import { ZodIssue } from "zod";
import { NextApiRequest, NextApiResponse } from "next";
import Billing from "@/types/billing";
import { createBilling } from "@/lib/billing";
import { Document } from "@/types/document";
import { createDocument } from "@/lib/documents";
import sendEmail from "@/lib/email";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "DELETE") {
    res.setHeader("Allow", ["GET", "POST", "PUT"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const apiToken = (req.headers.authorization || '').split("Bearer ").at(1)

  if (!apiToken || apiToken !== process.env.NEXT_PUBLIC_API_TOKEN) {
    return res.status(403).json({ success: false, errors: {}})
  }

  if (req.method === "GET") {
    const errors: FormErrors = {};

    const page = parseInt(req.query.page as string) || 1;
    const search = req.query.search as string || "";
    const searchBy = req.query.searchBy as string || "name";
    const limit = parseInt(req.query.limit as string) || 5;
    const sort = Array.isArray(req.query.sort) ? req.query.sort[0] : req.query.sort || "";

    let users: User[] = [];
    let totalUsers: number = 0;
    try {
      users = await getAllUsers(page, search, searchBy, limit, sort, undefined);
      totalUsers = await getTotalUsers();
      
      if(!users?.length) {
        errors['global'] = { message: 'Não existem usuários para esta busca.' }
        return res.status(500).json({ success: false, errors, data: { users: [], totalUsers: 0 } });
      }
    } catch(err) {
      console.error('Erro ao tentar encontrar usuários', err);
      errors['global'] = { message: 'Ocorreu um erro ao tentar encontrar usuários, tente novamente.' }
      return res.status(500).json({ success: false, errors });
    }

    return res.status(200).json({ success: true, errors, data: { users, totalUsers } });
  }

  if(req.method === "POST") {
    const errors: FormErrors = {};
    const { email, cpf, phone, price, price_text, down_payment, down_payment_text, billing_type, installment_count } = req.body;
  
    const validation = registerSchema.safeParse({ email, phone, price, price_text, down_payment, down_payment_text, billing_type, installment_count });
    if(!validation.success) {
      validation.error.errors.forEach((error: ZodIssue) => {
        errors[error.path[0]] = { message: error.message }
      });
  
      return res.status(400).json({ success: false, errors });
    }
  
    /**
     *  Check if user exists
     */
    try {
      const user: User | null = await getUserByEmail(email);
      if(user) {
        errors['global'] = { message: 'Ja existe uma conta registrada para este email.' };
        return res.status(409).json({ success: false, errors })
      }
    } catch(err) {
      errors['global'] = { message: 'Ocorreu um erro inesperado ao tentar verificar email, tente novamente.' };
      return res.status(500).json({ success: false, errors });
    }
  
    /**
     *  Create new user
     */
    let newUser: User | null = null;
    try {
      newUser = await createUser(email, phone);
    } catch (err) {
      console.error('Erro ao tentar criar novo usuário', err);
    }

    if(!newUser) {
      errors['global'] = { message: 'Ocorreu um erro ao tentar criar um novo usuário.' }
      return res.status(500).json({ success: false, errors });
    }
    
    let newBilling: Billing | null = null;
    try {
      newBilling = await createBilling(newUser.id, parseInt(price), price_text, parseInt(down_payment), down_payment_text, billing_type, parseInt(installment_count));
    } catch(err) {
      console.error('Erro ao tentar criar cobrança para novo usuário', err);
    }

    let idDocument: Document | null = null;
    try {
      idDocument = await createDocument(newUser.id, 'doc', 'RG/CNH');
    } catch(err) {
      console.error('Erro ao tentar criar cobrança para novo usuário', err);
    }
    
    let proofOfAddressDocument: Document | null = null;
    try {
      proofOfAddressDocument = await createDocument(newUser.id, 'doc', 'Comprovante de Residência');
    } catch(err) {
      console.error('Erro ao tentar criar cobrança para novo usuário', err);
    }

    if(!newBilling?.id || !idDocument || !proofOfAddressDocument?.id) {
      try {
        await deleteUser(newUser.id);
        errors['global'] = { message: "Usuário criado, mas ocorreu um erro inesperado ao tentar gerar cobrança. O processo foi revertido. Tente novamente." };
        return res.status(500).json({ success: false, errors });
      } catch(err) {
        console.error(`Erro ao tentar deletar usuário criado após falha na criação da cobrança. Email: ${newUser.email}`, err);
        errors['global'] = { message: "Ocorreu um erro crítico. Não foi possível reverter a criação do usuário após falha na cobrança. Contate o suporte." };
        return res.status(500).json({ success: false, errors });
      }
    }

    await sendEmail({
      type: "Novo cadastro",
      recipient: newUser.email,
      subject: "Novo cadastro",
      html: `
        <h2 style="font-size:20px;font-weight:700;line-height:28px;color:black">Você ja foi registrado em nossa plataforma</h2>
        <p style="font-size:16px;font-weight:400;line-height:20px:color:grey;margin-top:10px">Termine seu registro para ter acesso a tudo sobre seu processo</p>
        <ul style="margin-top:14px;margin-bottom:0;padding-left:16px">
          <li>
            <span class="font-weight:700;font-size:16px">Seu email de login:</span>
            <span class="font-weight:400;font-size:16px">${newUser.email}</span>
          </li>
          <li>
            <span class="font-weight:700;font-size:16px">Número de telefone cadastrado:</span>
            <span class="font-weight:400;font-size:16px">${newUser.phone}</span>
          </li>
        </ul>
        <p style="font-size:16px;font-weight:400;line-height:20px:color:grey">Caso algum dos dados esteja incorreto, por favor entre em contato</p>
        <p style="margin-top:40px">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="font-size:14px;text-decoration:none;color:white;background-color:#212121;border-radius:8px;padding-top:8px;padding-bottom:8px;padding-left:14px;padding-right:14px" target="_blank">Ir ao site</a>
        </p>
      `
    });

    return res.status(201).json({ success: true, message: 'Usuário criado com sucesso!', errors });
  }

  if(req.method === "PUT") {
    const { action } = req.body;
    const errors: FormErrors = {};

    if(!action) {
      errors['global'] = { message: 'Ação não permitida' }
      return res.status(500).json({ success: false, errors });
    }

    if(action === "signup") {
      const {
        first_name,
        last_name, 
        birth_date,
        rg, 
        cpf, 
        marital_status,
        nationality,
        profession, 
        email,
        phone, 
        street_address, 
        address_number, 
        neighbourhood, 
        city, 
        postal_code, 
        state
      } = req.body;

      let customer_id = "";

      try {
        let response = await fetch(`${process.env.ASAAS_API_URL}/customers`, {
          method: "POST",
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'access_token': process.env.ASAAS_API_TOKEN as string
          },
          body: JSON.stringify({
            name: `${first_name} ${last_name}`,
            cpfCnpj: cpf.replaceAll('.', '').replaceAll('-', ''),
            email: email
          })
        });

        if(!response.ok) {
          console.error(`An error ocurred while trying to generate customer ID for user\n\nNome:${first_name} ${last_name}\nCPF:${cpf}`);
          errors['global'] = { message: 'Ocorreu um erro ao tentar gerar seu ID de cliente, por favor tente novamente' };
          return res.status(500).json({ success: false, errors });
        }

        const data = await response.json();
        customer_id = data.id;
      } catch(err) {
        console.error('An error ocurred while trying to generate Customer in ASAAS', err);
        errors['global'] = { message: 'Ocorreu um erro ao tentar gerar seu ID de cliente, por favor tente novamente' };
        return res.status(500).json({ success: false, errors });
      }
  
      const validation = completeRegisterSchema.safeParse({
        customer_id,
        first_name,
        last_name, 
        birth_date,
        rg, 
        cpf, 
        marital_status,
        nationality,
        profession, 
        email,
        phone, 
        street_address, 
        address_number, 
        neighbourhood, 
        city, 
        postal_code, 
        state
      });
  
      if(!validation.success) {
        validation.error.errors.forEach((error: ZodIssue) => {
          errors[error.path[0]] = { message: error.message }
        });
    
        return res.status(400).json({ success: false, errors });
      }
      
      // Check if RG is already registered
      try {
        const user = await getUserByRg(rg);
        
        if(user) {
          errors['global'] = { message: 'Já existe uma conta registrada para este RG.' }
          return res.status(500).json({ success: false, errors });
        }
      } catch(err) {
        console.error('Erro ao tentar validar RG', err);
        errors['global'] = { message: 'Ocorreu um erro ao tentar validar seu registro, tente novamente mais tarde.' }
        return res.status(500).json({ success: false, errors });
      }

      // Check if CPF is already registered
      try {
        const user = await getUserByCpf(cpf);
        
        if(user) {
          errors['global'] = { message: 'Já existe uma conta registrada para este CPF.' }
          return res.status(500).json({ success: false, errors });
        }
      } catch(err) {
        console.error('Erro ao tentar validar CPF', err);
        errors['global'] = { message: 'Ocorreu um erro ao tentar validar seu registro, tente novamente mais tarde.' }
        return res.status(500).json({ success: false, errors });
      }

      /**
       *  Update user data
       */
      try {
        await completeRegister(
          customer_id,
          first_name, 
          last_name,
          birth_date,
          rg,
          cpf, 
          marital_status, 
          nationality, 
          profession, 
          email,
          phone, 
          street_address, 
          address_number, 
          neighbourhood, 
          city, 
          postal_code, 
          state
        );
      } catch (err) {
        console.error('Erro ao tentar finalizar cadastro de usuário', err);
        errors['global'] = { message: 'Ocorreu um erro ao tentar finalizar seu cadastro, tente novamente mais tarde.' }
        return res.status(500).json({ success: false, errors });
      }

      return res.status(200).json({ success: true, message: 'Seu cadastro foi finalizado com sucesso', errors });
    }

    if(action === "personal-data-update") {
      const {
        email,
        marital_status,
        profession
      } = req.body;
  
      const validation = personalDataSchema.safeParse({
        marital_status,
        profession
      });
  
      if(!validation.success) {
        validation.error.errors.forEach((error: ZodIssue) => {
          errors[error.path[0]] = { message: error.message }
        });
    
        return res.status(400).json({ success: false, errors });
      }

      try {
        await updatePersonalData(
          email as string,
          marital_status as string, 
          profession as string
        );
      } catch (err) {
        console.error('Erro ao tentar atualizar dados pessoais', err);
        errors['global'] = { message: 'Ocorreu um erro ao tentar atualizar seus dados pessoais, tente novamente mais tarde.' }
        return res.status(500).json({ success: false, errors });
      }

      return res.status(200).json({ success: true, message: 'Seus dados foram atualizados com sucesso', errors });
    }

    if(action === "contacts-update") {
      const {
        email,
        phone
      } = req.body;
  
      const validation = mobilePhoneSchema.safeParse(phone);
  
      if(!validation.success) {
        validation.error.errors.forEach((error: ZodIssue) => {
          errors[error.path[0]] = { message: error.message }
        });
    
        return res.status(400).json({ success: false, errors });
      }

      try {
        await updateContacts(
          email as string,
          phone as string
        );
      } catch (err) {
        console.error('Erro ao tentar atualizar contatos', err);
        errors['global'] = { message: 'Ocorreu um erro ao tentar atualizar seus contatos, tente novamente mais tarde.' }
        return res.status(500).json({ success: false, errors });
      }

      return res.status(200).json({ success: true, message: 'Seus contatos foram atualizados com sucesso', errors });
    }

    if(action === "address-update") {
      const {
        email,
        street_address,
        address_number,
        neighbourhood, 
        city, 
        postal_code, 
        state
      } = req.body;
      
      const validation = addressSchema.safeParse({ 
        street_address,
        address_number,
        neighbourhood, 
        city, 
        postal_code, 
        state 
      });

      
      if(!validation.success) {
        validation.error.errors.forEach((error: ZodIssue) => {
          errors[error.path[0]] = { message: error.message }
        });
        
        return res.status(400).json({ success: false, errors });
      }

      try {
        await updateAddress(
          email as string,
          street_address  as string, 
          address_number  as string, 
          neighbourhood as string, 
          city as string, 
          postal_code as string, 
          state as string
        );
      } catch (err) {
        console.error('Erro ao tentar atualizar seu endereço', err);
        errors['global'] = { message: 'Ocorreu um erro ao tentar atualizar seu endereço, tente novamente mais tarde.' }
        return res.status(500).json({ success: false, errors });
      }

      return res.status(200).json({ success: true, message: 'Endereço atualizado com sucesso', errors });
    }
  }
}
