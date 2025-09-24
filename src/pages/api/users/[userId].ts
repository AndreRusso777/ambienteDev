import User from "@/types/user";
import { deleteUser, getUserById } from "@/lib/user";
import { NextApiRequest, NextApiResponse } from "next";
import { FormErrors } from "@/types/form";
import { deleteUserDocuments } from "@/lib/documents";
import { deleteUserPayments } from "@/lib/payments";
import { deleteUserBilling } from "@/lib/billing";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST" || req.method === "PUT") {
    res.setHeader("Allow", ["GET", "DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const errors: FormErrors = {};

  const apiToken = (req.headers.authorization || '').split("Bearer ").at(1)

  if (!apiToken || apiToken !== process.env.NEXT_PUBLIC_API_TOKEN) {
    return res.status(403).json({ success: false, errors });
  }

  const { userId } = req.query;

  if(!userId) {
    errors['global'] = { message: "Não foi possível encontrar o usuário." }
    return res.status(400).json({ success: false, errors });
  }

  if(req.method === "GET") {
    try {
      const user: User | null = await getUserById(Array.isArray(userId) ? userId[0] : userId);
      return res.status(200).json({ success: true, errors, data: { user } });
    } catch(err) {
      console.error(err);
      errors['global'] = { message: "Ocorreu um erro ao tentar encontrar o usuário." }
      return res.status(500).json({success: false, errors });
    }
  }
  
  if(req.method === "DELETE") {
    try {
      await deleteUser(Array.isArray(userId) ? userId[0] : userId);
      await deleteUserBilling(Array.isArray(userId) ? userId[0] : userId);
      await deleteUserDocuments(Array.isArray(userId) ? userId[0] : userId);
      await deleteUserPayments(Array.isArray(userId) ? userId[0] : userId);
      return res.status(200).json({ success: true, errors });
    } catch(err) {
      console.error(err);
      errors['global'] = { message: "Ocorreu um erro ao tentar remover usuário." }
      return res.status(500).json({success: false, errors });
    }
  }
}
