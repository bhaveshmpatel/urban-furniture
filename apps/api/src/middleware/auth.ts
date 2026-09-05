import { Context, Next } from 'hono';

export const requireAuth = async (c: Context, next: Next) => {
  const userId = c.req.header('x-user-id');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  await next();
};

export const requireAdmin = async (c: Context, next: Next) => {
  const role = c.req.header('x-user-role');
  if (role !== 'ADMIN') return c.json({ error: 'Forbidden' }, 403);
  await next();
};

export const requireAccountant = async (c: Context, next: Next) => {
  const role = c.req.header('x-user-role');
  if (role !== 'ADMIN' && role !== 'ACCOUNTANT') return c.json({ error: 'Forbidden' }, 403);
  await next();
};
