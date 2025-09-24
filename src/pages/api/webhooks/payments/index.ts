import { updateDocumentSignStatus } from "@/lib/documents";
import { updatePaymentStatus } from "@/lib/payments";
import { updateUserStatus } from "@/lib/user";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const apiToken = req.headers["asaas-access-token"] || null;
  if (!apiToken || apiToken !== process.env.ASAAS_ACCESS_TOKEN) {
    return res.status(403).json({ success: false });
  }
  
  const { event, payment } = req.body;

  if(!payment.id) {
    return res.status(400).json({ success: false });
  }

  try {
    await updatePaymentStatus(payment.id, payment.status);
  } catch (err) {
    console.error(`Unexpected error while trying to change payment status for ${payment.id}`);
  }


  try {
    const status = "ACTIVE";
    await updateUserStatus(payment.customer, status);
  } catch (err) {
    console.error(`Unexpected error while trying to change user status`);
  }
  
  return res.status(200).json({ success: true });
}
