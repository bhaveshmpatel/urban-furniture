import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { logAudit } from "@repo/core";
import { getSession } from "@repo/auth";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const entry = await prisma.journalEntry.findUnique({ where: { id: params.id } });
  if (entry?.status === "CANCELLED") {
    return NextResponse.json({ error: "Cannot reset a cancelled entry" }, { status: 400 });
  }
  const data = await prisma.journalEntry.update({ where: { id: params.id }, data: { status: "DRAFT" } });
  
  const session = await getSession();
  await logAudit("JournalEntry", params.id, "RESET_TO_DRAFT", (session?.user as any)?.id || null, { status: entry?.status }, { status: "DRAFT" });
  
  return NextResponse.json(data);
}
