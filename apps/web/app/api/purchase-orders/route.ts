import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { withPagination } from "@repo/core";

export async function GET(req: Request) {
  const result = await withPagination(req, prisma.purchaseOrder, { include: { vendor: true, bill: true }, orderByField: 'orderDate', filterField: 'status' });
  return NextResponse.json(result);
}
export async function POST(req: Request) {
  const json = await req.json();

  const missingBudget = json.lines.some((l: any) => !l.analyticAccountId);
  if (missingBudget) {
    return NextResponse.json({ error: "All line items must be assigned to a Budget." }, { status: 400 });
  }

  const data = await prisma.purchaseOrder.create({ 
    data: {
      vendorId: json.vendorId,
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
