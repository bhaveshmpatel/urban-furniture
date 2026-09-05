import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { postFromVendorBill, validateExpenseBudgetLimits } from "@repo/core";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;

  const bill = await prisma.vendorBill.findUnique({
    where: { id: params.id },
    include: { lines: true }
  });

  if (!bill) return NextResponse.json({ error: "Bill not found" }, { status: 404 });

  try {
    const linesToValidate = bill.lines.map(l => ({
      analyticAccountId: l.analyticAccountId,
      total: Number(l.quantity) * Number(l.unitPrice)
    }));
    await validateExpenseBudgetLimits(linesToValidate, bill.invoiceDate);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const data = await prisma.vendorBill.update({ where: { id: params.id }, data: { status: "CONFIRMED" } });
  await postFromVendorBill(data.id);
  return NextResponse.json(data);
}
