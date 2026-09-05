import { Hono } from 'hono';
import {
  computeBalanceSheet,
  computeProfitAndLoss,
  computeBudgetReport,
  computeDashboard
} from '@repo/core';

export const reportsRouter = new Hono();

reportsRouter.get('/balance-sheet', async (c) => {
  const asOf = c.req.query('asOf');
  const result = await computeBalanceSheet(asOf ? new Date(asOf) : new Date());
  return c.json(result);
});

reportsRouter.get('/profit-and-loss', async (c) => {
  const from = c.req.query('from');
  const to = c.req.query('to');
  const result = await computeProfitAndLoss(
    from ? new Date(from) : new Date(0),
    to ? new Date(to) : new Date()
  );
  return c.json(result);
});

reportsRouter.get('/budget', async (c) => {
  const period = c.req.query('period');
  const result = await computeBudgetReport(period);
  return c.json(result);
});

reportsRouter.get('/dashboard', async (c) => {
  const result = await computeDashboard();
  return c.json(result);
});
