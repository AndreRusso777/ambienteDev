import { createSession } from "@/lib/auth";
import { getUTC3Date } from "@/lib/time";
import { getUserByEmail, getUserOtp, invalidateOtp } from "@/lib/user";
import { loginSchema } from "@/schemas/auth";
import { FormErrors } from "@/types/form";
import User from "@/types/user";
import { NextApiRequest, NextApiResponse } from "next";
import { ZodIssue } from "zod";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const apiToken = (req.headers.authorization || '').split("Bearer ").at(1)

  if (!apiToken || apiToken !== process.env.NEXT_PUBLIC_API_TOKEN) {
    return res.status(403).json({ success: false, errors: {}})
  }

  const { email, code } = req.body;

  const validation = loginSchema.safeParse({ email, otp: code });

  const errors: FormErrors = {};
  if(!validation.success) {
    validation.error.errors.forEach((error: ZodIssue) => {
      errors[error.path[0]] = { message: error.message }
    });

    return res.status(400).json({ success: false, errors });
  }

  let otpData;

  try {
    otpData = await getUserOtp(email);
  } catch(err) {
    errors['global'] = { message: 'Ocorreu um erro ao tentar confirmar seu código de acesso, por favor tente novamente' };
    return res.status(500).json({ success: false, errors });
  }

  if(!otpData) {
    errors['global'] = { message: 'Ocorreu um erro ao tentar confirmar seu código de acesso, por favor tente novamente' };
    return res.status(500).json({ success: false, errors });
  }

  const { otp, otpExpiry } = otpData;

  if(otp !== code) {
    errors['global'] = { message: 'Código de acesso inválido, tente gerar um novo código' };
    return res.status(400).json({ success: false, errors });
  }

  const now = getUTC3Date(new Date().toISOString());

  if(now.getTime() > otpExpiry.getTime()) {
    errors['global'] = { message: 'Código de acesso expirado, tente gerar um novo código' };
    return res.status(400).json({ success: false, errors });
  }

  try {
    await invalidateOtp(email);
  } catch(err) {
    errors['global'] = { message: 'Ocorreu um erro inesperado em nossos servidores, por favor tente novamente' };
    return res.status(500).json({ success: false, errors });
  }

  const user: User | null = await getUserByEmail(email);

  if(!user) {
    errors['global'] = { message: 'Occoreu um erro ao tentar inciar sua sessão, por favor tente novamente' };
    return res.status(400).json({ success: false, errors });
  }

  let session; 
  try {
    session = await createSession(user.id);
  } catch(err) {
    errors['global'] = { message: 'Occoreu um erro ao tentar inciar sua sessão, por favor tente novamente' };
    return res.status(500).json({ success: false, errors });
  }

  const cookie = `auth_session=${session.id}; HttpOnly; Path=/; SameSite=Strict; Expires=${session.expiresAt.toUTCString()}; ${process.env.NODE_ENV === "production" ? "Secure" : ""}`;
  res.setHeader("Set-Cookie", cookie);

  return res.status(200).json({ success: true, errors });
}