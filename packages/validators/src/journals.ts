import { z } from 'zod';

export const JournalType = z.enum(['SALES', 'PURCHASE', 'BANK', 'CASH', 'GENERAL']);

export const createJournalSchema = z.object({
  name: z.string().min(1, 'Journal name is required'),
  type: JournalType,
  defaultDebitAccountId: z.string().optional(),
  defaultCreditAccountId: z.string().optional(),
});

export const updateJournalSchema = createJournalSchema.partial();

export type JournalTypeEnum = z.infer<typeof JournalType>;
export type CreateJournalInput = z.infer<typeof createJournalSchema>;
export type UpdateJournalInput = z.infer<typeof updateJournalSchema>;
