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
