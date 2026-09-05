import { z } from "zod";

export const paymentSchema = z.object({
  id: z.string().optional(),
  amount: z.number().min(0),
  date: z.date().or(z.string()),
  method: z.string().min(1, "Method is required"),
});

export type PaymentInput = z.infer<typeof paymentSchema>;
