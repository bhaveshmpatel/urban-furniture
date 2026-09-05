import { z } from 'zod';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{9,}$/;
const LOGIN_ID_REGEX = /^[a-zA-Z0-9]{6,12}$/;

export const signupSchema = z.object({
  loginId: z.string().regex(LOGIN_ID_REGEX, 'Login ID must be 6-12 alphanumeric characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().regex(PASSWORD_REGEX, 'Password must be >8 chars and contain uppercase, lowercase, and special character'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  loginId: z.string().min(1, 'Login ID is required'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
