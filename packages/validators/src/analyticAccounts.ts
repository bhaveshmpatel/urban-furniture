import { z } from 'zod';

export const AnalyticType = z.enum(['INCOME', 'EXPENSE']);

export const createAnalyticAccountSchema = z.object({
  name: z.string().min(1, 'Analytic account name is required'),
  type: AnalyticType,
});

export const updateAnalyticAccountSchema = createAnalyticAccountSchema.partial();

export type AnalyticTypeEnum = z.infer<typeof AnalyticType>;
export type CreateAnalyticAccountInput = z.infer<typeof createAnalyticAccountSchema>;
export type UpdateAnalyticAccountInput = z.infer<typeof updateAnalyticAccountSchema>;
