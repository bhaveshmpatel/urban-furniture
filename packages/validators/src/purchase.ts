import { z } from "zod";

export const purchaseSchema = z.object({
  id: z.string().optional(),
  supplierId: z.string().min(1, "Supplier is required"),
  date: z.date().or(z.string()),
  totalAmount: z.number().min(0),
});

export type PurchaseInput = z.infer<typeof purchaseSchema>;
