import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import Decimal from "decimal.js";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  
  const entry = await prisma.journalEntry.findUnique({ where: { id: params.id }, include: { items: true } });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });
  
  const totalDebit = entry.items.reduce((acc, i) => acc.plus(new Decimal(i.debit.toString())), new Decimal(0));
  const totalCredit = entry.items.reduce((acc, i) => acc.plus(new Decimal(i.credit.toString())), new Decimal(0));
  
  if (!totalDebit.equals(totalCredit)) {
    return NextResponse.json({ error: "Debits must equal credits to post entry." }, { status: 400 });
  }
  
  if (totalDebit.isZero()) {
    return NextResponse.json({ error: "Entry must be non-zero." }, { status: 400 });
  }
  
  const data = await prisma.journalEntry.update({ where: { id: params.id }, data: { status: "POSTED" } });
  return NextResponse.json(data);
}
