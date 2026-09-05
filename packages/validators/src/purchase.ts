import { z } from 'zod';

export const purchaseOrderLineSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantity: z.number().positive('Quantity must be a positive number'),
  unitPrice: z.number().nonnegative('Unit price must be zero or a positive number'),
});

export const createPurchaseOrderSchema = z.object({
  vendorId: z.string().min(1, 'Vendor is required'),
  lines: z
    .array(purchaseOrderLineSchema)
    .min(1, 'At least one order line is required'),
});

export const updatePurchaseOrderSchema = z.object({
  lines: z.array(purchaseOrderLineSchema).min(1, 'At least one order line is required').optional(),
});

export const convertToBillSchema = z.object({
  invoiceDate: z.coerce.date({ errorMap: () => ({ message: 'Invoice date must be a valid date' }) }),
  dueDate: z.coerce.date({ errorMap: () => ({ message: 'Due date must be a valid date' }) }),
});

export type PurchaseOrderLineInput = z.infer<typeof purchaseOrderLineSchema>;
export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;
export type UpdatePurchaseOrderInput = z.infer<typeof updatePurchaseOrderSchema>;
export type ConvertToBillInput = z.infer<typeof convertToBillSchema>;
