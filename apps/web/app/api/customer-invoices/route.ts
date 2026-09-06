import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { withPagination } from "@repo/core";

export async function GET(req: Request) {
  const result = await withPagination(req, prisma.customerInvoice, { include: { customer: true, salesOrder: true }, orderByField: 'invoiceDate', filterField: 'status', searchFields: ['invoiceNumber', 'customer.name'] });
  return NextResponse.json(result);
}
export async function POST(req: Request) {
  const json = await req.json();
  const data = await prisma.customerInvoice.create({ 
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
