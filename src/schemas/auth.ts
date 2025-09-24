import { z } from 'zod';
import { cpfSchema, emailSchema } from './user';

// Login validatation
export const loginSchema = z.object({
  email: emailSchema,
  otp: z.string().min(6, { message: "O código de acesso deve ter no mínimo 6 caracteres." }).max(6, { message: "O código de acesso deve ter no máximo 6 caracteres" })
});