export default interface Billing {
  id: number;
  user_id: number;
  price: number;
  price_text: string;
  down_payment: number;
  down_payment_text: string;
  billing_type: string;
  installment_count: number;
  created_at: Date,
  updated_at: Date
}