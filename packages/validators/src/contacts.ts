import { z } from 'zod';

export const ContactType = z.enum(['CUSTOMER', 'VENDOR', 'BOTH']);

export const createContactSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    type: ContactType,
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    mobile: z.string().optional(),
    addressCity: z.string().optional(),
    addressState: z.string().optional(),
    addressPincode: z.string().optional(),
    profileImageUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
    createLogin: z.boolean().optional().default(false),
    loginId: z.string().optional(),
    loginEmail: z.string().optional(),
    loginPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.createLogin) {
        return !!(data.loginId && /^[a-zA-Z0-9]{6,12}$/.test(data.loginId));
      }
      return true;
    },
    {
      message: 'Login ID must be 6-12 alphanumeric characters when creating a login',
      path: ['loginId'],
    },
  )
  .refine(
    (data) => {
      if (data.createLogin) {
        return !!(data.loginEmail && z.string().email().safeParse(data.loginEmail).success);
      }
      return true;
    },
    {
      message: 'A valid email is required when creating a login',
      path: ['loginEmail'],
    },
  )
  .refine(
    (data) => {
      if (data.createLogin) {
        return !!(
          data.loginPassword &&
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{9,}$/.test(data.loginPassword)
        );
      }
      return true;
    },
    {
      message:
        'Password must be >8 chars with uppercase, lowercase, and special character when creating a login',
      path: ['loginPassword'],
    },
  );

export const updateContactSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  type: ContactType.optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  mobile: z.string().optional(),
  addressCity: z.string().optional(),
  addressState: z.string().optional(),
  addressPincode: z.string().optional(),
  profileImageUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
});

export type ContactTypeEnum = z.infer<typeof ContactType>;
export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
