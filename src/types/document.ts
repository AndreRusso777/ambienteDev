export interface Document {
  id: number;
  type: "contract" | "poa" | "doc" | "tax" | "hipo";
  title: string;
  user_id: number;
  filename: string;
  path: string;
  mime: string;
  size: number;
  approved: 0 | 1;
  token: string;
  token_expiry: string;
  signer_token: string;
  signed: 0 | 1;
  created_at: string;
  updated_at: string;
}