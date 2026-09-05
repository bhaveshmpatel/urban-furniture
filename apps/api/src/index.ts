import { Hono } from 'hono';
import { prisma } from '@repo/db';
import { transactionsRouter } from './transactions';
import { reportsRouter } from './reports';
import { masterDataRouter } from "./master-data";

import { requireAuth, requireAdmin, requireAccountant } from './middleware/auth';

const app = new Hono();

app.get('/health', (c) => c.json({ status: 'ok' }));

// Master Data GET Endpoints






// Transaction GET Endpoints





// Routing
app.route("/", masterDataRouter);

app.route('/transactions', transactionsRouter);
app.route('/reports', reportsRouter);

export default {
  port: 3001,
  fetch: app.fetch,
};
