import { getUserByCpf } from "@/lib/user";
import { FormErrors } from "@/types/form";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const errors: FormErrors = {};

  const apiToken = (req.headers.authorization || '').split("Bearer ").at(1)

  if (!apiToken || apiToken !== process.env.CHATMIX_ACCESS_TOKEN) {
    return res.status(403).json({ success: false, errors });
  }

  const { userCpf } = req.query;

  if(!userCpf) {
    errors['global'] = { message: "Não foi possível encontrar o usuário." }
    return res.status(400).json({ success: false, errors });
  }

  try {
    const user = await getUserByCpf(Array.isArray(userCpf) ? userCpf[0] : userCpf);
    
    if(!user) {
      errors['global'] = { message: 'Usuário não encontrado.' }
      return res.status(500).json({ success: false, errors });
    }

    return res.status(200).json({ 
      success: true, 
      errors, 
      data: {
        user: {
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          cpf: user.cpf
        }
      }
    });
  } catch(err) {
    console.error('Erro ao tentar validar CPF', err);
    errors['global'] = { message: 'Ocorreu um erro ao tentar encontrar usuário, tente novamente mais tarde.' }
    return res.status(500).json({ success: false, errors });
  }
}
