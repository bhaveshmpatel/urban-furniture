import { z } from 'zod';

export const AccountType = z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE']);

export const createAccountSchema = z.object({
  name: z.string().min(1, 'Account name is required'),
  type: AccountType,
  code: z.string().optional(),
});

export const updateAccountSchema = createAccountSchema.partial();

export type AccountTypeEnum = z.infer<typeof AccountType>;
export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
