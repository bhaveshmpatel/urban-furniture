import { NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function GET() {
  try {
    const data = await prisma.journalEntry.findMany({ 
      include: { journal: true, items: { include: { account: true, contact: true } } }, 
      orderBy: { date: 'desc' } 
    });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const data = await prisma.journalEntry.create({ 
      data: {
        journalId: json.journalId,
        date: new Date(json.date),
        reference: json.reference || null,
        items: {
          create: (json.items || []).map((l: any) => ({
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
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
