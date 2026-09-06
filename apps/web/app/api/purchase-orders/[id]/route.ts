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

  const missingBudget = json.lines.some((l: any) => !l.analyticAccountId);
  if (missingBudget) {
    return NextResponse.json({ error: "All line items must be assigned to a Budget." }, { status: 400 });
  }

  const orderDate = new Date(json.orderDate);
  const amountByAnalytic: Record<string, number> = {};
  for (const l of json.lines) {
    const amt = Number(l.quantity) * Number(l.unitPrice);
    amountByAnalytic[l.analyticAccountId] = (amountByAnalytic[l.analyticAccountId] || 0) + amt;
  }

  for (const [analyticId, amount] of Object.entries(amountByAnalytic)) {
    const budget = await prisma.budget.findFirst({
      where: {
        analyticAccountId: analyticId,
        periodStart: { lte: orderDate },
        periodEnd: { gte: orderDate },
        status: { not: "CANCELLED" }
      }
    });

    if (!budget) {
      return NextResponse.json({ error: `No active budget found for the selected date and budget account.` }, { status: 400 });
    }

    const existingLines = await prisma.purchaseOrderLine.findMany({
      where: {
        analyticAccountId: analyticId,
        purchaseOrderId: { not: params.id }, // Exclude the current PO
        purchaseOrder: {
          orderDate: {
            gte: budget.periodStart,
            lte: budget.periodEnd
          },
          status: { not: "CANCELLED" }
        }
      },
      select: { quantity: true, unitPrice: true }
    });
    
    const committedTotal = existingLines.reduce((acc, l) => acc + (Number(l.quantity) * Number(l.unitPrice)), 0);

    if (committedTotal + amount > Number(budget.committedAmount)) {
      const available = Number(budget.committedAmount) - committedTotal;
      return NextResponse.json({ error: `PO exceeds allocated budget for '${budget.name}'. Available: ₹${available.toLocaleString(undefined, { minimumFractionDigits: 2 })}, Requested: ₹${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` }, { status: 400 });
    }
  }

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
