import { NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function GET() {
  const data = await prisma.vendorBill.findMany({ include: { vendor: true, purchaseOrder: true }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json(data);
}
export async function POST(req: Request) {
  const json = await req.json();
  const data = await prisma.vendorBill.create({ 
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
