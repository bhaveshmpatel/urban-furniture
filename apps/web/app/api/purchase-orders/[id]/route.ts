import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const data = await prisma.purchaseOrder.findUnique({ where: { id: params.id }, include: { vendor: true, lines: { include: { product: true } }, bill: true } });
  return NextResponse.json(data);
}
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const json = await req.json();
  // We'll just delete existing lines and recreate them for simplicity
  await prisma.purchaseOrderLine.deleteMany({ where: { purchaseOrderId: params.id } });
  const data = await prisma.purchaseOrder.update({ 
    where: { id: params.id }, 
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
