import { NextApiRequest, NextApiResponse } from "next";
import nodemailer from "nodemailer";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const apiToken = (req.headers.authorization || '').split("Bearer ").at(1);
  if (!apiToken || apiToken !== process.env.NEXT_PUBLIC_API_TOKEN) {
    return res.status(403).json({ success: false, errors: {} });
  }

  const { type, recipient, subject, text } = req.body;

  if(!type) {
    return res.status(400).json({ message: "No email type provided" });
  }

  if(!recipient) {
    return res.status(400).json({ message: "No recipient provided" });
  }

  if(!subject) {
    return res.status(400).json({ message: "No subject provided" });
  }

  if(!text) {
    return res.status(400).json({ message: "No email text provided" });
  }
  
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT as string),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
    });

    const message = {
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to: recipient,
      subject: `Dr. Gorila - ${subject}`,
      text: text
    };

    await transporter.sendMail(message);
  } catch (error) {
    console.error('An error ocurred while trying to send email', error);
  }
}
