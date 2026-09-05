import { z } from "zod";

export const saleSchema = z.object({
  id: z.string().optional(),
  customerId: z.string().min(1, "Customer is required"),
  date: z.date().or(z.string()),
  totalAmount: z.number().min(0),
});

export type SaleInput = z.infer<typeof saleSchema>;
