import { z } from 'zod';
export const createJournalSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['SALES', 'PURCHASE', 'BANK', 'CASH', 'GENERAL']),
  defaultDebitAccountId: z.string().optional(),
  defaultCreditAccountId: z.string().optional()
});
export const updateJournalSchema = createJournalSchema.partial();
