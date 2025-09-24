export default interface Payment {
  id: number,
  user_id: number,
  payment_id: string,
  status: string,
  invoice_url: string,
  created_at: Date,
  updated_at: Date
}