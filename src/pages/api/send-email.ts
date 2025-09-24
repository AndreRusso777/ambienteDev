import { NextRequest, NextResponse } from "next/server";
import nodemailer, { Transporter } from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import StreamTransport from "nodemailer/lib/stream-transport";

export default async function handler(req: NextRequest) {
  const { email, subject, text } = await req.json();

  // Validate inputs
  if(!email || !text) {
    return NextResponse.json({ message: 'Missing email or message content.' }, { status: 400 });
  }

  try {
    const inProduction = process.env.NODE_ENV === 'production';

    let transporter: Transporter<SMTPTransport.SentMessageInfo | StreamTransport.SentMessageInfo>;
    let transporterOptions: SMTPTransport.Options | StreamTransport.Options;

    if(inProduction) {
      // SMTP Transporter Options (Used during Production)
      transporterOptions = {
        host: process.env.SMTP_HOST,    // SMTP Server
        port: 465,                      // Use SSL Port
        secure: true,                   // SSL/TLS
        auth: {
          user: process.env.SMTP_USER,  // SMTP User
          pass: process.env.SMTP_PASS,  // SMTP Password
        },
      }
    } else {
      // Stream Transporter Options (Used during Development)
      transporterOptions = {
        streamTransport: true,
        buffer: true,
        newline: 'unix'
      };
    }

    // Create transporter
    transporter = nodemailer.createTransport(transporterOptions);

    // Send the email
    const info = await transporter.sendMail({
      from: '"App Name" <no-reply@appdomin.com',
      to: email,
      subject: subject,
      text: text,
      html: `${text}`
    });

    return NextResponse.json({ message: 'Email sent', info });
  } catch (err) {
    return NextResponse.json({ message: 'Failed while trying to send email', err }, { status: 500 });
  }
}