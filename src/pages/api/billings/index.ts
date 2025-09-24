import { getBillingByUserId } from "@/lib/billing";
import Billing from "@/types/billing";
import { FormErrors } from "@/types/form";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const apiToken = (req.headers.authorization || '').split("Bearer ").at(1);

  if (!apiToken || apiToken !== process.env.NEXT_PUBLIC_API_TOKEN) {
    return res.status(403).json({ success: false, errors: {} });
  }

  const errors: FormErrors = {};
  const userId = parseInt(req.query.userId as string) || null;  

  if(!userId) {
    errors['global'] = { message: "Não foi possível buscar cobranças para este usuário" };
    return res.status(400).json({ success: false, errors });
  }
  
  try {
    const billing: Billing | null = await getBillingByUserId(userId);

    if(!billing) {
      errors['global'] = { message: "Não foi possível encontrar cobranças para este usuário" };
      return res.status(400).json({ success: false, errors });
    }

    return res.status(200).json({ success: true, errors, data: { billing }});
  } catch (error) {
    console.error("Unexpected error while trying to get documents:", error);
    errors['global'] = { message: "Erro ao tentar buscar os documentos do usuário, tente novamente" };
    res.status(500).json({ success: false, errors });
  }
}
