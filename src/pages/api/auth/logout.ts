import { destroySession } from "@/lib/auth";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  const apiToken = (req.headers.authorization || '').split("Bearer ").at(1)

  if (!apiToken || apiToken !== process.env.NEXT_PUBLIC_API_TOKEN) {
    return res.status(403).json({ success: false, errors: {}})
  }

  const { auth_session: sessionId } = req.cookies;

  if(!sessionId) {
    return res.status(500).json({ success: false, errors: {}});
  }

  try {
    await destroySession(sessionId);
  } catch(err) {
    return res.status(500).json({ success: false, errors: {}});
  }

  const cookie = `auth_session=; HttpOnly; Path=/; SameSite=Strict; Expires=Thu, 01 Jan 1970 00:00:00 GMT; ${process.env.NODE_ENV === "production" ? "Secure" : ""}`;
  res.setHeader("Set-Cookie", cookie);
  return res.status(200).json({ success: true, errors: {} });
}