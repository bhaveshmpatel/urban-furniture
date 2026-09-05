import { z } from 'zod';

export const createBudgetSchema = z
  .object({
    name: z.string().min(1, 'Budget name is required'),
    /** Period label, e.g. "2026-Q1" or "2026-01" */
    period: z.string().min(1, 'Period is required'),
    periodStart: z.coerce.date({ errorMap: () => ({ message: 'Period start must be a valid date' }) }),
    periodEnd: z.coerce.date({ errorMap: () => ({ message: 'Period end must be a valid date' }) }),
    plannedAmount: z.number().positive('Planned amount must be a positive number'),
    analyticAccountId: z.string().min(1, 'Analytic account is required'),
    responsibleUserId: z.string().min(1, 'Responsible user is required'),
  })
  .refine((data) => data.periodEnd > data.periodStart, {
    message: 'Period end must be after period start',
    path: ['periodEnd'],
  });

export const updateBudgetSchema = z.object({
  name: z.string().min(1, 'Budget name is required').optional(),
  period: z.string().min(1, 'Period is required').optional(),
  periodStart: z
    .coerce.date({ errorMap: () => ({ message: 'Period start must be a valid date' }) })
    .optional(),
  periodEnd: z
    .coerce.date({ errorMap: () => ({ message: 'Period end must be a valid date' }) })
    .optional(),
  plannedAmount: z.number().positive('Planned amount must be a positive number').optional(),
  analyticAccountId: z.string().min(1, 'Analytic account is required').optional(),
  responsibleUserId: z.string().min(1, 'Responsible user is required').optional(),
});

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
