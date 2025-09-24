import { updateDocumentSignStatus } from "@/lib/documents";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) { 
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const apiToken = (req.headers.authorization || '').split("Bearer ").at(1);
  if (!apiToken || apiToken !== process.env.ZAPSIGN_ACCESS_TOKEN) {
    return res.status(403).json({ success: false });
  }
  
  const { token, signers, signer_who_signed } = req.body;

  if(!token) {
    return res.status(400).json({ success: false });
  }

  const isValidSigner = signers?.some((signer: any) => signer.token === signer_who_signed?.token) || 
                       !signers?.length || 
                       signers?.every((signer: any) => !signer.token);

  if(isValidSigner) {
    try {
      await updateDocumentSignStatus(token);
    } catch (err) {
      console.error("Erro ao alterar status do documento.");
      return res.status(500).json({ success: false });
    }
  }
  
  return res.status(200).json({ success: true });
}
