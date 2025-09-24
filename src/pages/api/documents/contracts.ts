import statesOptions from "@/constants/states";
import { createDocument, deleteDocument, getDocumentByType } from "@/lib/documents";
import { Document } from "@/types/document";
import { FormErrors } from "@/types/form";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "PUT") {
    res.setHeader("Allow", ["POST", "GET", "DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const apiToken = (req.headers.authorization || '').split("Bearer ").at(1);
  if (!apiToken || apiToken !== process.env.NEXT_PUBLIC_API_TOKEN) {
    return res.status(403).json({ success: false, errors: {} });
  }

  if(req.method === "GET") {
    const errors: FormErrors = {};
    const { userId } = req.query;

    const user_id = Array.isArray(userId) ? parseInt(userId[0]) : userId ? parseInt(userId) : null;

    if(!user_id) {
      errors['global'] = { message: "Usuário não encontrado" };
      return res.status(400).json({ success: false, errors });
    }

    let document: Document | null = null;
    try {
      document = await getDocumentByType(user_id, 'contract');
      
    } catch (err) {
      console.error("Unexpected error while trying to find document:", err);
      errors['global'] = { message: "Erro ao tentar encontrar documento" };
      return res.status(500).json({ success: false, errors });
    }

    if(!document) {
      console.error("Document not found");
      errors['global'] = { message: "Documento não encontrado" };
      return res.status(500).json({ success: false, errors });
    }

    return res.status(200).json({ success: true, errors, data: { document: document } });
  }

  if(req.method === "POST") {
    const errors: FormErrors = {};
    const { user, billing } = req.body;

    if(!user) {
      errors['global'] = { message: "Usuário não encontrado" };
      return res.status(404).json({ success: false, errors });
    }

    if(!billing) {
      errors['global'] = { message: "Método de pagamento não encontrado" };
      return res.status(404).json({ success: false, errors });
    }
    
    const installments_text: { [key: number]: string } = {
      1: "Uma",
      2: "Duas",
      3: "Três",
      4: "Quatro",
      5: "Cinco",
      6: "Seis",
      7: "Sete",
      8: "Oito",
      9: "Nove",
      10: "Dez",
      11: "Onze",
      12: "Doze"
    }
    
    const installments = `${billing.installment_count} (${installments_text[billing.installment_count]})`;
    const remaining_installments = billing.installment_count - 1 === 0 ? '0 (Zero)' : `${billing.installment_count - 1} (${installments_text[billing.installment_count - 1]})`;
    
    const today = new Date();
    
    const first_installment_date = new Date(today);
    first_installment_date.setMonth(first_installment_date.getMonth() + 1);

    let token: string | null = null;
    let tokenExpiry: string | null = null;
    let signerToken: string | null = null;

    try {
      const response = await fetch(`${process.env.ZAP_SIGN_API_URL}/models/create-doc/`, { 
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${process.env.ZAP_SIGN_API_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          template_id: process.env.ZAP_SIGN_CONTRACT_TOKEN,
          signer_name: `${user.first_name} ${user.last_name}`,
          send_automatic_email: true,
          send_automatic_whatsapp: false,
          signature_order_active: true,
          lang: "pt-br",
          "data":[
            {
                de:"{{NOME COMPLETO}}",
                para: `${user.first_name} ${user.last_name}`
            },
            {
              de:"{{NACIONALIDADE}}",
              para: user.nationality
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
              de:"{{NASCIMENTO}}",
              para: user.birth_date.split('T').at(0)?.split('-').reverse().join('/')
            },
            {
              de:"{{N.º DO RG}}",
              para: user.rg
            },
            {
              de:"{{UF}}",
              para: user.state
            },
            {
              de:"{{N.º DO CPF}}",
              para: user.cpf
            },
            {
              de:"{{ENDEREÇO COMPLETO}}",
              para: `${user.street_address} ${user.address_number} ${user.neighbourhood} ${user.city} - ${statesOptions.find((option: any) => option.value === user.state)?.label || user.state} ${user.postal_code}`
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
              de:"{{VALOR EM R$ E POR EXTENSO}}",
              para: `R$ ${billing.price},00 (${billing.price_text} reais)`
            },
            {
              de:"{{NÚMERO DE PARCELAS E POR EXTENSO}}",
              para: installments
            },
            {
              de:"{{ENTRADA R$ E POR EXTENSO}}",
              para: billing.installment_count === 1 ? `R$ ${billing.price},00 (${billing.price_text} reais)` : `R$ ${billing.down_payment},00 (${billing.down_payment_text} reais)`
            },
            {
              de:"{{NÚMERO DE PARCELAS REMANESCENTES E POR EXTENSO}}",
              para: remaining_installments
            },
            {
              de:"{{VALOR DAS PARCELAS REMANESCENTES EM R$ E POR EXTENSO}}",
              para: billing.installment_count === 1 ? "R$ 0,00 (Zero reais)" : `R$ ${(billing.price - billing.down_payment) / ((billing.installment_count - 1) || 1)},00`
            },
            {
              de:"{{DATA DE VENCIMENTO DA PRIMEIRA PARCELA}}",
              para: first_installment_date.toISOString().split("T")[0].split('-').reverse().join('/')
            },
            {
              de: "{{PIX, BOLETO, CARTÃO DE CRÉDITO}}",
              para: billing.billing_type === 'CREDIT_CARD' ? 'Cartão de Crédito' : 'Pix'
            },
            {
              de: "{{SUA CIDADE}}",
              para: user.city
            },
            {
              de: "{{DIA}}",
              para: today.toLocaleDateString('pt-BR', { day: "2-digit" })
            },
            {
              de: "{{MES}}",
              para: today.toLocaleDateString('pt-BR', { month: "long" }).charAt(0).toLocaleUpperCase() + today.toLocaleDateString('pt-BR', { month: "long" }).slice(1)
            },
            {
              de: "{{ANO}}",
              para: today.toLocaleDateString('pt-BR', { year: "numeric" })
            }
          ]
        })
      });

      if(!response.ok) {
        errors['global'] = { message: "Erro ao tentar gerar documento para assinatura" };
        return res.status(400).json({ success: false, errors });
      }
      
      const responseData = await response.json();
      token = responseData.token;
      tokenExpiry = responseData.created_at;
      signerToken = responseData.signers[0].token;
    } catch(err) {
      console.error('Error while trying to create document in ZapSign', err);
      errors['global'] = { message: "Erro ao tentar criar documento para assinatura" };
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

    if(!signerToken) {
      errors['global'] = { message: "Token do signatário não encontrado" };
      return res.status(404).json({ success: false, errors });
    }
    
    try {
      await createDocument(user.id, 'contract', 'Contrato de Prestação dos Serviços', token, tokenExpiry, signerToken);
    } catch (error) {
      console.error("Unexpected error during file upload:", error);
      errors['global'] = { message: "Erro ao tentar criar novo documento, tente novamente" };
      return res.status(500).json({ success: false, errors });
    }

    return res.status(200).json({ success: true, message: 'Contrato criado com sucesso', errors, data: { signer_token: signerToken }});
  }

  if(req.method === "DELETE") {
    const errors: FormErrors = {};
    const { id, token } = req.query;

    const contractId = Array.isArray(id) ? parseInt(id[0]) : id ? parseInt(id) : null;
    const contractToken = Array.isArray(token) ? token[0] : token;

    if(!contractId) {
      errors['global'] = { message: "ID do contrato inválido" };
      return res.status(400).json({ success: false, errors });
    }

    if(!contractToken) {
      errors['global'] = { message: "Token do contrato inválido" };
      return res.status(400).json({ success: false, errors });
    }

    let deleteFromDb: boolean = false;
    try {
      const response = await fetch(`${process.env.ZAP_SIGN_API_URL}/docs/${contractToken}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${process.env.ZAP_SIGN_API_TOKEN}`
        }
      });

      if(!response.ok) {
        errors['global'] = { message: "Ocorreu um erro inesperado ao tentar remover contrato" };
        return res.status(500).json({ success: false, errors });
      }

      deleteFromDb = true;
    } catch(err) {
      console.error(err);
      errors['global'] = { message: "Erro ao tentar deletar o contrato." };
      return res.status(500).json({ success: false, errors });
    }

    if(deleteFromDb) {
      try {
        await deleteDocument(contractId);
        return res.status(200).json({ success: true, errors });
      } catch (err) {
        console.error("Unexpected error while trying to delete contract:", err);
        errors['global'] = { message: "Erro ao tentar eliminar contrato" };
        return res.status(500).json({ success: false, errors });
      }
    }
  }
}
