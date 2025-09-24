import { z } from 'zod';

export const emailSchema = z.string().email({ message: "Você deve fornecer um endereço de email válido" });

export const cpfSchema = z.string().trim().min(14, { message: "Por favor, digite um número de CPF válido" });

export const mobilePhoneSchema = z.string()
  .length(15, { message: "O número de telefone deve ter pelomenos 15 caracteres" })
  .regex(/^\(\d{2}\) \d{5}-\d{4}$/, { message: "Você deve fornecer um número de telefone válido." });

// User registration validation schema
export const registerSchema = z.object({
  email: emailSchema,
  phone: mobilePhoneSchema,
  price: z.string().trim().min(1, { message: "Por favor, informe um preço válido" }),
  price_text: z.string().trim().min(1, { message: "Por favor, informe o preço por extenso" }),
  down_payment: z.string().trim().min(1, { message: "Por favor, informe um valor de entrada válido" }),
  down_payment_text: z.string().trim().min(1, { message: "Por favor, informe o valor de entrada por extenso" }),
  billing_type: z.enum(["CREDIT_CARD", "PIX"], { message: "Método de pagamento inválido" }),
  installment_count: z.number().min(1, { message: "Por favor, informe apenas números para as parcelas" }).max(12, { message: "O limite máximo de parcelas são doze"}),
});

// Complete register validation schema
export const completeRegisterSchema = z.object({
  customer_id: z.string().trim().min(1, { message: "Erro ao tentar gerar ID de cliente" }),
  first_name: z.string().trim().min(3, { message: "Por favor, informe um primeiro nome válido" }),
  last_name: z.string().trim().min(3, { message: "Por favor, informe um sobrenome válido"}),
  birth_date: z.string()
  .refine((value: string) => {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    const today = new Date();

    if(date.getTime() >= today.getTime()) return false;

    if (!year || !month || !day) return false;

    if (year < 1900 || year > today.getFullYear()) return false;

    if (month < 1 || month > 12) return false;

    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    if (isLeapYear) daysInMonth[1] = 29;

    return day >= 1 && day <= daysInMonth[month - 1];
  }, { message: "Data de nascimento inválida" }),
  rg: z.string().min(6, { message: "Por favor, informe um número de RG válido"}),
  cpf: cpfSchema,
  marital_status: z.string().trim().min(3, { message: "Por favor, informe uma nacionalidade válida"}),
  nationality: z.string().trim().min(3, { message: "Por favor, informe uma nacionalidade válida"}),
  profession: z.string().trim().min(2, { message: "Por favor, informe uma profissão"}),
  email: emailSchema,
  phone: mobilePhoneSchema,
  street_address: z.string().trim().min(3, { message: "Por favor, informe um endereço válido" }),
  address_number: z.string().trim().min(1, { message: "Por favor, informe um número válido" }),
  neighbourhood: z.string().trim().min(3, { message: "Por favor, informe um bairro válido"}),
  city: z.string().trim().min(1, { message: "Por favor, informe uma cidade válida" }),
  postal_code: z.string().trim().min(9, { message: "Por favor, informe seu código postal" }),
  state: z.string().trim().min(1, { message: "Por favor, informe um estado válido" }),
});

// Personal data validation schema
export const personalDataSchema = z.object({
  marital_status: z.string().trim().min(3, { message: "Por favor, informe uma nacionalidade válida"}),
  profession: z.string().trim().min(2, { message: "Por favor, informe uma profissão"})
});

// Address data validation schema
export const addressSchema = z.object({
  street_address: z.string().trim().min(3, { message: "Por favor, informe um endereço válido" }),
  address_number: z.string().trim().min(1, { message: "Por favor, informe um número válido" }),
  neighbourhood: z.string().trim().min(3, { message: "Por favor, informe um bairro válido"}),
  city: z.string().trim().min(1, { message: "Por favor, informe uma cidade válida" }),
  postal_code: z.string().trim().min(9, { message: "Por favor, informe seu código postal" }),
  state: z.string().trim().min(1, { message: "Por favor, informe um estado válido" }),
});