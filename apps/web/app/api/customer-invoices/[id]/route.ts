import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const data = await prisma.customerInvoice.findUnique({ where: { id: params.id }, include: { customer: true, lines: { include: { product: true } }, salesOrder: true } });
  return NextResponse.json(data);
}
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const json = await req.json();
  
  await prisma.customerInvoiceLine.deleteMany({ where: { invoiceId: params.id } });
  const data = await prisma.customerInvoice.update({ 
    where: { id: params.id }, 
    data: {
      customerId: json.customerId,
      invoiceDate: new Date(json.invoiceDate),
      dueDate: new Date(json.dueDate),
      totalAmount: Number(json.totalAmount),
      taxAmount: Number(json.taxAmount || 0),
      lines: {
        create: json.lines.map((l: any) => ({
          productId: l.productId,
          analyticAccountId: l.analyticAccountId || null,
          quantity: Number(l.quantity),
          unitPrice: Number(l.unitPrice)
        }))
      }
    }
  });
  return NextResponse.json(data);
}
