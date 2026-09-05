import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const data = await prisma.journalEntry.findUnique({ 
    where: { id: params.id }, 
    include: { journal: true, items: { include: { account: true, contact: true } } } 
  });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const json = await req.json();
  
  await prisma.journalItem.deleteMany({ where: { journalEntryId: params.id } });
  const data = await prisma.journalEntry.update({ 
    where: { id: params.id }, 
    data: {
      journalId: json.journalId,
      date: new Date(json.date),
      reference: json.reference,
      items: {
        create: json.items.map((l: any) => ({
          accountId: l.accountId,
          contactId: l.contactId || null,
          analyticAccountId: l.analyticAccountId || null,
          debit: Number(l.debit || 0),
          credit: Number(l.credit || 0)
        }))
      }
    }
  });
  return NextResponse.json(data);
}
