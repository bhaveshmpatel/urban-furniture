import { Hono } from 'hono';
import { prisma } from '@repo/db';
import { requireAccountant } from './middleware/auth';
import { createProductSchema, createContactSchema, createAccountSchema, createJournalSchema } from '@repo/validators';

export const masterDataRouter = new Hono();

masterDataRouter.get('/products', async (c) => c.json(await prisma.product.findMany()));
masterDataRouter.post('/products', requireAccountant, async (c) => {
  try {
    const data = createProductSchema.parse(await c.req.json());
    const product = await prisma.product.create({ data });
    return c.json(product, 201);
  } catch (err: any) { return c.json({ error: err.message }, 400); }
});

masterDataRouter.get('/contacts', async (c) => c.json(await prisma.contact.findMany()));
masterDataRouter.post('/contacts', requireAccountant, async (c) => {
  try {
    const data = createContactSchema.parse(await c.req.json());
    const contact = await prisma.contact.create({ data: {
      name: data.name, type: data.type, email: data.email, 
      phone: data.mobile, city: data.addressCity, state: data.addressState, pincode: data.addressPincode
    }});
    return c.json(contact, 201);
  } catch (err: any) { return c.json({ error: err.message }, 400); }
});

masterDataRouter.get('/accounts', async (c) => c.json(await prisma.account.findMany()));
masterDataRouter.post('/accounts', requireAccountant, async (c) => {
  try {
    const data = createAccountSchema.parse(await c.req.json());
    const acc = await prisma.account.create({ data });
    return c.json(acc, 201);
  } catch (err: any) { return c.json({ error: err.message }, 400); }
});

masterDataRouter.get('/journals', async (c) => c.json(await prisma.journal.findMany()));
masterDataRouter.post('/journals', requireAccountant, async (c) => {
  try {
    const data = createJournalSchema.parse(await c.req.json());
    const j = await prisma.journal.create({ data: {
      name: data.name, type: data.type, defaultAccountId: data.defaultDebitAccountId!
    }});
    return c.json(j, 201);
  } catch (err: any) { return c.json({ error: err.message }, 400); }
});

masterDataRouter.get('/sales-orders', async (c) => c.json(await prisma.salesOrder.findMany({ include: { customer: true } })));
masterDataRouter.get('/purchase-orders', async (c) => c.json(await prisma.purchaseOrder.findMany({ include: { vendor: true } })));

masterDataRouter.get('/analytic-accounts', async (c) => c.json(await prisma.analyticAccount.findMany()));
masterDataRouter.post('/analytic-accounts', requireAccountant, async (c) => {
  try {
    const data = await c.req.json();
    const acc = await prisma.analyticAccount.create({ data: { name: data.name, type: data.type } });
    return c.json(acc, 201);
  } catch (err: any) { return c.json({ error: err.message }, 400); }
});
