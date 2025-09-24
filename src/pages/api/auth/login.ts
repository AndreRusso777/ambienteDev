import { getUserByEmail, updateUserOtp } from "@/lib/user";
import User from "@/types/user";
import { FormErrors } from "@/types/form";
import { ZodIssue } from "zod";
import { emailSchema } from "@/schemas/user";
import crypto from 'node:crypto';
import { getUTC3Date } from "@/lib/time";
import { NextApiRequest, NextApiResponse } from "next";
import sendEmail from "@/lib/email";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const apiToken = (req.headers.authorization || '').split("Bearer ").at(1)

  if (!apiToken || apiToken !== process.env.NEXT_PUBLIC_API_TOKEN) {
    return res.status(403).json({ success: false, errors: {}})
  }
  
  const { email } = await req.body;

  const validation = emailSchema.safeParse(email);

  const errors: FormErrors = {};
  if(!validation.success) {
    validation.error.errors.forEach((error: ZodIssue) => {
      errors[error.path[0]] = { message: error.message }
    });

    return res.status(400).json({ success: false, errors });
  }

  // Check if user exists
  const user: User | null = await getUserByEmail(email);

  if(!user) {
    errors['global'] = { message: 'Endereço de email incorreto' };
    return res.status(400).json({ success: false, errors });
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  
  const tenMinutesAhead = new Date(new Date().getTime() + 10 * 60 * 1000);
  const otpExpiry = getUTC3Date(tenMinutesAhead.toISOString());

  try {
    const response = await updateUserOtp(email, otp, otpExpiry);
    
    if(response) {
      await sendEmail({
        type: "Código de acesso",
        recipient: user.email,
        subject: "Seu novo código de acesso",
        html: `
          <h2 style="font-size:20px;font-weight:700;line-height:28px;color:black;">Olá!</h2>

          <p style="font-size:16px;font-weight:400;line-height:24px;color:#333;margin-top:10px;">
            Esperamos que esteja bem. Aqui está seu novo código de acesso:
          </p>

          <p style="font-size:28px;font-weight:700;letter-spacing:4px;color:#000;margin:20px 0;">
            ${otp}
          </p>

          <p style="font-size:16px;font-weight:400;line-height:24px;color:#555;">
            Lembre-se: este código expira em 10 minutos. Caso não termine seu login dentro desse tempo, solicite um novo código em nossa plataforma.
          </p>
        `
      });
      return res.status(200).json({ success: true, errors });
    }
  } catch(err) {
    console.error('Failed to generate OTP for the user.')
    errors['global'] = { message: 'Um erro inesperado aconteceu, por favor tente novamente.' };
    return res.status(500).json({ success: false, errors });
  }
}
