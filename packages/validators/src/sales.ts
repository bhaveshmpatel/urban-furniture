import { z } from 'zod';

export const salesOrderLineSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantity: z.number().positive('Quantity must be a positive number'),
  unitPrice: z.number().nonnegative('Unit price must be zero or a positive number'),
  taxPercent: z.number().min(0, 'Tax cannot be negative').max(100, 'Tax cannot exceed 100%').default(0),
});

export const createSalesOrderSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  lines: z
    .array(salesOrderLineSchema)
    .min(1, 'At least one order line is required'),
});

export const updateSalesOrderSchema = z.object({
  lines: z.array(salesOrderLineSchema).min(1, 'At least one order line is required').optional(),
});

export const generateInvoiceSchema = z.object({
  invoiceDate: z.coerce.date({ errorMap: () => ({ message: 'Invoice date must be a valid date' }) }),
  dueDate: z.coerce.date({ errorMap: () => ({ message: 'Due date must be a valid date' }) }),
});

export type SalesOrderLineInput = z.infer<typeof salesOrderLineSchema>;
export type CreateSalesOrderInput = z.infer<typeof createSalesOrderSchema>;
export type UpdateSalesOrderInput = z.infer<typeof updateSalesOrderSchema>;
export type GenerateInvoiceInput = z.infer<typeof generateInvoiceSchema>;
