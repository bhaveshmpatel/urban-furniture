import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const json = await req.json();
  const data = await prisma.journal.update({ where: { id: params.id }, data: json });
  return NextResponse.json(data);
}
