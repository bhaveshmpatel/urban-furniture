import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const data = await prisma.vendorBill.findUnique({ where: { id: params.id }, include: { vendor: true, lines: { include: { product: true } }, purchaseOrder: true } });
  return NextResponse.json(data);
}
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const json = await req.json();

  const missingBudget = json.lines.some((l: any) => !l.analyticAccountId);
  if (missingBudget) {
    return NextResponse.json({ error: "All line items must be assigned to a Budget." }, { status: 400 });
  }

  await prisma.vendorBillLine.deleteMany({ where: { billId: params.id } });
  const data = await prisma.vendorBill.update({ 
    where: { id: params.id }, 
    data: {
      vendorId: json.vendorId,
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
