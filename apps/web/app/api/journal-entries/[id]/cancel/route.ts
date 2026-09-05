import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const data = await prisma.journalEntry.update({ where: { id: params.id }, data: { status: "CANCELLED" } });
  return NextResponse.json(data);
}
