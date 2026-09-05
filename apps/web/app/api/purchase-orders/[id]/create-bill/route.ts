import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const po = await prisma.purchaseOrder.findUnique({ where: { id: params.id }, include: { lines: true } });
  if (!po) return NextResponse.json({ error: "PO not found" }, { status: 404 });
  
  const total = po.lines.reduce((acc, l) => acc + (Number(l.quantity) * Number(l.unitPrice)), 0);

  const bill = await prisma.vendorBill.create({
    data: {
      vendorId: po.vendorId,
      purchaseOrderId: po.id,
      invoiceDate: new Date(),
      dueDate: new Date(),
      totalAmount: total,
      taxAmount: 0,
      lines: {
        create: po.lines.map(l => ({
          productId: l.productId,
          analyticAccountId: l.analyticAccountId,
          quantity: Number(l.quantity),
          unitPrice: Number(l.unitPrice)
        }))
      }
    }
  });
  return NextResponse.json(bill);
}
