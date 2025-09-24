import { z } from "zod";

export const paymentSchema = z.object({
  customer_id: z.string().min(1, { message: "ID de cliente inválido"}),
  billing_type: z.enum(["CREDIT_CARD", "PIX"], { message: "Método de pagamento inválido" }),
  price: z.string().trim().min(1, { message: "Valor para pagamento inválido, por favor entre em contato conosco" }),
});