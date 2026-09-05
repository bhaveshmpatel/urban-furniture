import { z } from "zod";

export const budgetSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Budget Name is required"),
  periodStart: z.coerce.date({ required_error: "Start Date is required" }),
  periodEnd: z.coerce.date({ required_error: "End Date is required" }),
  analyticAccountId: z.string().min(1, "Analytic Account is required"),
  committedAmount: z.number().min(0, "Committed Amount must be positive"),
  responsibleContactId: z.string().min(1, "Responsible Contact is required"),
});

export type BudgetInput = z.infer<typeof budgetSchema>;

export const reviseBudgetSchema = z.object({
  committedAmount: z.number().min(0, "Committed Amount must be positive"),
});

export type ReviseBudgetInput = z.infer<typeof reviseBudgetSchema>;
