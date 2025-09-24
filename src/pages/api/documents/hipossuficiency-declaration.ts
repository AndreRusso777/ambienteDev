import statesOptions from "@/constants/states";
import { resetDocumentToken, updateDocumentTokenWithSigner } from "@/lib/documents";
import { FormErrors } from "@/types/form";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "DELETE") {
    res.setHeader("Allow", ["POST", "GET", "PUT"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const apiToken = (req.headers.authorization || '').split("Bearer ").at(1);
  if (!apiToken || apiToken !== process.env.NEXT_PUBLIC_API_TOKEN) {
    return res.status(403).json({ success: false, errors: {} });
  }

  if(req.method === "GET") {
    const errors: FormErrors = {};
    const { token } = req.query;

    const parsedToken = Array.isArray(token) ? token[0] : token ? token : null;

    if(!parsedToken) {
      errors['global'] = { message: "Declaração de hipossuficiência não encontrada" };
      return res.status(400).json({ success: false, errors });
    }

    let sign_url: string = "";
    try {
      const response = await fetch(`${process.env.ZAP_SIGN_API_URL}/docs/${parsedToken}`, {
        method: 'GET',
        headers: {
          "Authorization": `Bearer ${process.env.ZAP_SIGN_API_TOKEN}`
        },
      });

      if(!response.ok) {
        errors['global'] = { message: "Ocorreu um erro ao tentar encontrar endereço do documento" };
        return res.status(400).json({ success: false, errors });
      }

      const data = await response.json();
      sign_url = data.signers[0].sign_url;
    } catch (err) {
      console.error("Unexpected error while trying to find document:", err);
      errors['global'] = { message: "Erro ao tentar encontrar declaração de hipossuficiência" };
      return res.status(500).json({ success: false, errors });
    }

    if(!sign_url) {
      console.error("Link para assinatura não encontrado");
      errors['global'] = { message: "Link para assinatura não encontrado" };
      return res.status(500).json({ success: false, errors });
    }

    return res.status(200).json({ success: true, errors, data: { sign_url } });
  }

  if(req.method === "POST") {
    const errors: FormErrors = {};
    const { user, documentId } = req.body;

    if(!user) {
      errors['global'] = { message: "Usuário não encontrado" };
      return res.status(404).json({ success: false, errors });
    }
        
    const today = new Date();

    let token: string | null = null;
    let tokenExpiry: string | null = null;
    let signUrl: string | null = null;
    let signerToken: string | null = null;

    try {
      const response = await fetch(`${process.env.ZAP_SIGN_API_URL}/models/create-doc/`, { 
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${process.env.ZAP_SIGN_API_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          template_id: process.env.ZAP_SIGN_HIPO_TOKEN,
          signer_name: `${user.first_name} ${user.last_name}`,
          send_automatic_email: false,
          send_automatic_whatsapp: false,
          signature_order_active: true,
          lang: "pt-br",
          "data":[
            {
              de:"{{NOME COMPLETO}}",
              para: `${user.first_name} ${user.last_name}`
            },
            {
              de:"{{ESTADO CIVIL}}",
              para: user.marital_status
            },
            {
              de:"{{PROFISSÃO}}",
              para: user.profession
            },
            {
              de:"{{DATA DE NASCIMENTO}}",
              para: user.birth_date ? user.birth_date.split('T').at(0)?.split('-').reverse().join('/') : ""
            },
            {
              de:"{{N.º DO RG}}",
              para: user.rg
            },
            {
              de:"{{UF DO RG}}",
              para: user.state
            },
            {
              de:"{{N.º DO CPF}}",
              para: user.cpf
            },
            {
              de:"{{ENDEREÇO}}",
              para: `${user.street_address}`
            },
            {
              de:"{{N.º DO ENDEREÇO}}",
              para: `${user.address_number}`
            },
            {
              de:"{{BAIRRO}}",
              para: `${user.neighbourhood}`
            },
            {
              de:"{{CIDADE}}",
              para: `${user.city}`
            },
            {
              de:"{{ESTADO}}",
              para: `${statesOptions.find((option: any) => option.value === user.state)?.label || user.state}`
            },
            {
              de:"{{CEP}}",
              para: `${user.postal_code}`
            },
            {
              de:"{{E-MAIL}}",
              para: user.email
            },
            {
              de:"{{TELEFONE CELULAR}}",
              para: user.phone
            },
            {
              de:"{{SUA CIDADE}}",
              para: user.city
            },
            {
              de:"{{DIA}}",
              para: today.toLocaleDateString('pt-BR', { day: "2-digit" })
            },
            {
              de:"{{MES}}",
              para: today.toLocaleDateString('pt-BR', { month: "long" }).charAt(0).toLocaleUpperCase() + today.toLocaleDateString('pt-BR', { month: "long" }).slice(1)
            },
            {
              de:"{{ANO}}",
              para: today.toLocaleDateString('pt-BR', { year: "numeric" })
            }
          ]
        })
      });

      if(!response.ok) {
        errors['global'] = { message: "Erro ao tentar gerar declaração de hipossuficiência para assinatura" };
        return res.status(400).json({ success: false, errors });
      }
      
      const responseData = await response.json();

      token = responseData.token;
      tokenExpiry = responseData.created_at;
      signUrl = responseData.signers[0].sign_url;
      signerToken = responseData.signers[0].token;
    } catch(err) {
      console.error('Error while trying to create hipossuficiency declaration in ZapSign', err);
      errors['global'] = { message: "Erro ao tentar criar declaração de hipossuficiência para assinatura" };
      return res.status(400).json({ success: false, errors });
    }
    
    if(!token) {
      errors['global'] = { message: "Não foi encontrado token para o documento criado" };
      return res.status(404).json({ success: false, errors });
    }
    
    if(!tokenExpiry) {
      errors['global'] = { message: "Não foi encontrada data de expiração para o token do documento criado" };
      return res.status(404).json({ success: false, errors });
    }

    if(!signUrl) {
      errors['global'] = { message: "URL para assinatura não encontrada" };
      return res.status(404).json({ success: false, errors });
    }

    if(!signerToken) {
      errors['global'] = { message: "Token do signatário não encontrado" };
      return res.status(404).json({ success: false, errors });
    }
    
    try {
      await updateDocumentTokenWithSigner(documentId, token, tokenExpiry, signerToken);
    } catch (error) {
      console.error("Unexpected error during hipossuficiency declaration creation:", error);
      errors['global'] = { message: "Erro ao tentar criar nova declaração de hipossuficiência, tente novamente" };
      return res.status(500).json({ success: false, errors });
    }

    return res.status(200).json({ success: true, message: 'Declaração de hipossuficiência criada com sucesso', errors, data: { sign_url: signUrl }});
  }

  if(req.method === "PUT") {
    const errors: FormErrors = {};
    const { id, token } = req.body;

    if(!id) {
      errors['global'] = { message: "ID da declaração de hipossuficiência é inválido" };
      return res.status(400).json({ success: false, errors });
    }

    if(!token) {
      errors['global'] = { message: "Token da declaração de hipossuficiência é inválido" };
      return res.status(400).json({ success: false, errors });
    }

    let resetHipo: boolean = false;
    try {
      const response = await fetch(`${process.env.ZAP_SIGN_API_URL}/docs/${token}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${process.env.ZAP_SIGN_API_TOKEN}`
        }
      });

      if(!response.ok) {
        errors['global'] = { message: "Ocorreu um erro inesperado ao tentar remover declaração de hipossuficiência" };
        return res.status(500).json({ success: false, errors });
      }

      resetHipo = true;
    } catch(err) {
      console.error(err);
      errors['global'] = { message: "Erro ao tentar deletar declaração de hipossuficiência." };
      return res.status(500).json({ success: false, errors });
    }

    if(resetHipo) {
      try {
        await resetDocumentToken(token);
        return res.status(200).json({ success: true, errors });
      } catch (err) {
        console.error("Unexpected error while trying to reset hipossuficiency declaration token:", err);
        errors['global'] = { message: "Erro ao tentar atualizar declaração de hipossuficiência" };
        return res.status(500).json({ success: false, errors });
      }
    }
  }
}
