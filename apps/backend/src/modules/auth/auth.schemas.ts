import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email('Введите корректный email').toLowerCase(),
  password: z.string().min(1, 'Введите пароль'),
});

export const registerSchema = z.object({
  email: z.string().trim().email('Введите корректный email').toLowerCase(),
  password: z.string().min(8, 'Пароль должен быть не короче 8 символов'),
  businessType: z.string().trim().min(1).max(80).nullable().optional(),
});

export type LoginDto = z.infer<typeof loginSchema>;
export type RegisterDto = z.infer<typeof registerSchema>;
