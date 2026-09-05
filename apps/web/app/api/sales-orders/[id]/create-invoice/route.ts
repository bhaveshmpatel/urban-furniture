import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const so = await prisma.salesOrder.findUnique({ where: { id: params.id }, include: { lines: true } });
  if (!so) return NextResponse.json({ error: "SO not found" }, { status: 404 });
  
  const total = so.lines.reduce((acc, l) => acc + (Number(l.quantity) * Number(l.unitPrice)), 0);

  const invoice = await prisma.customerInvoice.create({
    data: {
      customerId: so.customerId,
      salesOrderId: so.id,
      invoiceDate: new Date(),
      dueDate: new Date(),
      totalAmount: total,
      taxAmount: 0,
      lines: {
        create: so.lines.map(l => ({
          productId: l.productId,
          analyticAccountId: l.analyticAccountId,
          quantity: Number(l.quantity),
          unitPrice: Number(l.unitPrice)
        }))
      }
    }
  });
  return NextResponse.json(invoice);
}
