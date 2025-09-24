import { FormErrors } from "@/types/form";
import { ZodIssue } from "zod";
import { NextApiRequest, NextApiResponse } from "next";
import { createPayment, getPayment, getPaymentForUser } from "@/lib/payments";
import { paymentSchema } from "@/schemas/payment";

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

    const paymentId = req.query.paymentId as string;
    const userId = req.query.userId as string;

    if(!paymentId && !userId) {
      errors['global'] = { message: 'ID de cobrança ou ID de usuário não fornecidos' }
      return res.status(400).json({ success: false, errors });
    }

    if(paymentId) {
      try {
        const payment = await getPayment(paymentId);
  
        if(!payment) {
          errors['global'] = { message: 'Nenhuma cobrança ou pagamento encontrado.' }
          return res.status(404).json({ success: false, errors });
        }
  
        return res.status(200).json({ success: false, errors, data: { payment } });
      } catch(err) {
        console.error('Erro ao tentar encontrar cobranças', err);
        errors['global'] = { message: 'Ocorreu um erro ao tentar encontrar cobranças, tente novamente.' }
        return res.status(500).json({ success: false, errors });
      }
    }

    try {
      const payment = await getPaymentForUser(userId);

      if(!payment) {
        errors['global'] = { message: 'Nenhuma cobrança ou pagamento encontrado para este usuário.' }
        return res.status(404).json({ success: false, errors });
      }

      return res.status(200).json({ success: false, errors, data: { payment } });
    } catch(err) {
      console.error('Erro ao tentar encontrar cobranças', err);
      errors['global'] = { message: 'Ocorreu um erro ao tentar encontrar cobranças, tente novamente.' }
      return res.status(500).json({ success: false, errors });
    }
    
  }

  if(req.method === "POST") {
    const errors: FormErrors = {};

    let client_ip = req.headers["x-forwarded-for"];
    if (Array.isArray(client_ip)) client_ip = client_ip[0];
    if (client_ip?.includes("::ffff:")) client_ip = client_ip.split("::ffff:")[1];
    
    const { user_id, customer_id, billing_type, price, installment_count } = req.body;

    if(!user_id) {
      console.error('Nenhum ID de usuário informado.')
      errors['global'] = { message: 'Nenhum ID de usuário informado' };
      return res.status(400).json({ success: false, errors }); 
    }
  
    const validation = paymentSchema.safeParse({ customer_id, billing_type, price });
    if(!validation.success) {
      validation.error.errors.forEach((error: ZodIssue) => {
        errors[error.path[0]] = { message: error.message }
      });
  
      return res.status(400).json({ success: false, errors });
    }

    // Data to create payment
    const createPaymentData: any = {
      billingType: billing_type,
      customer: customer_id,
      dueDate: new Date().toISOString().split('T')[0],
      remoteIp: client_ip
    }

    if(!installment_count || installment_count === 1) {
      createPaymentData["value"] = price;
    } else  {
      createPaymentData["installmentCount"] = installment_count;
      createPaymentData["totalValue"] = price;
    }

    let paymentData: any = null; 
    try {
      const response = await fetch(`${process.env.ASAAS_API_URL}/payments`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          "access_token": process.env.ASAAS_API_TOKEN as string
        },
        body: JSON.stringify(createPaymentData)
      });

      if(!response.ok) {
        errors['global'] = { message: 'Ocorreu um erro ao tentar iniciar o processo de pagamento, tente novamente.' };
        return res.status(400).json({ success: false, errors })
      }

      paymentData = await response.json();
    } catch(err) {
      console.error('Ocorreu um erro ao iniciar processo de pagamento, tente novamente.', err);
      errors['global'] = { message: 'Ocorreu um erro ao iniciar processo de pagamento, tente novamente.' };
      return res.status(500).json({ success: false, errors })
    }

    try {
      const payment = await createPayment(user_id, paymentData.id, paymentData.status, paymentData.invoiceUrl);
      return res.status(201).json({ success: true, errors, data: { payment } });
    } catch(err) {
      console.error('Não foi possível salvar os dados do pagamento');
    }

    try {
      const response = await fetch(`${process.env.ASAAS_API_URL}/payments/${paymentData.id}`, {
        method: "DELETE",
        headers: {
          accept: "application/json",
          "access_token": process.env.ASAAS_API_TOKEN as string
        }
      })

      if(!response.ok) {
        errors['global'] = { message: 'Ocorreu um erro ao tentar deletar cobrança gerada anteriormente. Por favor contate-nos' };
        return res.status(400).json({ success: false, errors })
      }
    } catch(err) {
      console.error('Ocorreu um erro ao deletar cobrança', err);
      errors['global'] = { message: 'Ocorreu um erro sistêmico ao tentar deletar cobrança gerada anteriormente. Por favor contate-nos por meio de outros canais' };
      return res.status(500).json({ success: false, errors })
    }
  }
}