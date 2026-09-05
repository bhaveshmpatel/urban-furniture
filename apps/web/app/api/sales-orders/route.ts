import { NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function GET() {
  const data = await prisma.salesOrder.findMany({ include: { customer: true, invoice: true }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json(data);
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
