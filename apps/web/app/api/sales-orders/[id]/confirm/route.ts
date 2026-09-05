import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const data = await prisma.salesOrder.update({ where: { id: params.id }, data: { status: "CONFIRMED" } });
  return NextResponse.json(data);
}
