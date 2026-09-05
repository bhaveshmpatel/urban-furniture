import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { validateExpenseBudgetLimits } from "@repo/core";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: params.id },
    include: { lines: true }
  });

  if (!po) return NextResponse.json({ error: "PO not found" }, { status: 404 });

  try {
    const linesToValidate = po.lines.map(l => ({
      analyticAccountId: l.analyticAccountId,
      total: Number(l.quantity) * Number(l.unitPrice)
    }));
    await validateExpenseBudgetLimits(linesToValidate, po.orderDate);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const data = await prisma.purchaseOrder.update({ where: { id: params.id }, data: { status: "CONFIRMED" } });
  return NextResponse.json(data);
}
