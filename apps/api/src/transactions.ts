import { Hono } from 'hono';
import { prisma } from '@repo/db';
import {
  postFromVendorBill,
  postFromCustomerInvoice,
  postFromPayment
} from '@repo/core';

export const transactionsRouter = new Hono();

// Vendor Bills
transactionsRouter.post('/vendor-bills/:id/confirm', async (c) => {
  const { id } = c.req.param();
  try {
    const entry = await postFromVendorBill(id);
    return c.json({ success: true, entry });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
});

// Customer Invoices
transactionsRouter.post('/customer-invoices/:id/confirm', async (c) => {
  const { id } = c.req.param();
  try {
    const entry = await postFromCustomerInvoice(id);
    return c.json({ success: true, entry });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
});

// Payments
transactionsRouter.post('/payments', async (c) => {
  try {
    const body = await c.req.json();
    
    // Create payment first
    const payment = await prisma.payment.create({
      data: {
        contactId: body.contactId,
        method: body.method,
        amount: body.amount,
        vendorBillId: body.vendorBillId,
        customerInvoiceId: body.customerInvoiceId,
      }
    });

    const entry = await postFromPayment(payment.id);
    return c.json({ success: true, payment, entry });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
});
