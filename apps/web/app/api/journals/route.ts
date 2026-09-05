import { NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function GET() {
  const data = await prisma.journal.findMany({ include: { defaultDebitAccount: true } });
  return NextResponse.json(data);
}
export async function POST(req: Request) {
  const json = await req.json();
  const data = await prisma.journal.create({ data: json });
  return NextResponse.json(data);
}
