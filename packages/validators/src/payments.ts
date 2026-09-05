import { z } from 'zod';

export const PaymentMethod = z.enum(['CASH', 'BANK']);

export const createPaymentSchema = z
  .object({
    contactId: z.string().min(1, 'Contact is required'),
    method: PaymentMethod,
    amount: z.number().positive('Amount must be a positive number'),
    /**
     * Optional ISO date string; coerced to Date.
     * Defaults to the current date/time when omitted.
     */
    paymentDate: z.coerce
      .date({ errorMap: () => ({ message: 'Payment date must be a valid date' }) })
      .optional()
      .default(() => new Date()),
    vendorBillId: z.string().optional(),
    customerInvoiceId: z.string().optional(),
  })
  .refine(
    (data) => {
      const hasVendorBill = !!data.vendorBillId;
      const hasCustomerInvoice = !!data.customerInvoiceId;
      // Exactly one must be truthy (XOR)
      return hasVendorBill !== hasCustomerInvoice;
    },
    {
      message: 'Exactly one of vendorBillId or customerInvoiceId must be provided',
      path: ['vendorBillId'],
    },
  );

export type PaymentMethodEnum = z.infer<typeof PaymentMethod>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
