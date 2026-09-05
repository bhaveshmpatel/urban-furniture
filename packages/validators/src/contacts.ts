import { z } from 'zod';
export const createContactSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['CUSTOMER', 'VENDOR', 'BOTH']),
  email: z.string().email().optional(),
  mobile: z.string().optional(),
  addressCity: z.string().optional(),
  addressState: z.string().optional(),
  addressPincode: z.string().optional(),
  profileImageUrl: z.string().url().optional(),
  createLogin: z.boolean().optional(),
  loginId: z.string().optional(),
  loginEmail: z.string().email().optional(),
  loginPassword: z.string().optional()
});
export const updateContactSchema = createContactSchema.partial();
