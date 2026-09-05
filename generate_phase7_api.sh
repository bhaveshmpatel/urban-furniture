#!/bin/bash
mkdir -p apps/web/app/api/journal-entries/\[id\]/post
mkdir -p apps/web/app/api/journal-entries/\[id\]/reset-to-draft
mkdir -p apps/web/app/api/journal-entries/\[id\]/cancel

cat << 'EOF' > apps/web/app/api/journal-entries/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function GET() {
  const data = await prisma.journalEntry.findMany({ 
    include: { journal: true, items: { include: { account: true, contact: true } } }, 
    orderBy: { date: 'desc' } 
  });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const json = await req.json();
  const data = await prisma.journalEntry.create({ 
    data: {
      journalId: json.journalId,
      date: new Date(json.date),
      reference: json.reference,
      status: "DRAFT",
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
EOF

cat << 'EOF' > apps/web/app/api/journal-entries/[id]/route.ts
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
EOF

cat << 'EOF' > apps/web/app/api/journal-entries/[id]/post/route.ts
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
EOF

cat << 'EOF' > apps/web/app/api/journal-entries/[id]/reset-to-draft/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const entry = await prisma.journalEntry.findUnique({ where: { id: params.id } });
  if (entry?.status === "CANCELLED") {
    return NextResponse.json({ error: "Cannot reset a cancelled entry" }, { status: 400 });
  }
  const data = await prisma.journalEntry.update({ where: { id: params.id }, data: { status: "DRAFT" } });
  return NextResponse.json(data);
}
EOF

cat << 'EOF' > apps/web/app/api/journal-entries/[id]/cancel/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const data = await prisma.journalEntry.update({ where: { id: params.id }, data: { status: "CANCELLED" } });
  return NextResponse.json(data);
}
EOF
