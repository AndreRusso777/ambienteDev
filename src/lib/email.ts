import nodemailer from "nodemailer";

interface Email {
  type: string;
  recipient: string;
  subject: string;
  text?: string;
  html?: string;
}

export default async function sendEmail({ type, recipient, subject, text, html }: Email) {
  if(!html && !text) {
    console.error('No text/html provided to send email.')
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

    const message: any = {
			from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to: recipient,
      subject: subject
    };

    if(html) {
      message.html = html;
    }

    if(text) {
      message.text = text;
    }

    await transporter.sendMail(message);
  } catch (error) {
    console.error('An error ocurred while trying to send email', error);
  }
}
