import { z } from 'zod';
export const createAccountSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE', 'BANK', 'CASH', 'CAPITAL', 'OTHER_EXPENSE']),
  code: z.string().optional()
});
export const updateAccountSchema = createAccountSchema.partial();
