import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { withPagination } from "@repo/core";

export async function GET(req: Request) {
  const result = await withPagination(req, prisma.salesOrder, { include: { customer: true, invoice: true }, orderByField: 'orderDate', filterField: 'status' });
  return NextResponse.json(result);
}
export async function POST(req: Request) {
  const json = await req.json();
  const data = await prisma.salesOrder.create({ 
    data: {
      customerId: json.customerId,
      orderDate: new Date(json.orderDate),
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
