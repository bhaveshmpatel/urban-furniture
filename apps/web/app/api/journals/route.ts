import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { withPagination } from "@repo/core";

export async function GET(req: Request) {
  try {
    const result = await withPagination(req, prisma.journal, { filterField: 'type', searchFields: ['name'] });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
export async function POST(req: Request) {
  const json = await req.json();
  const data = await prisma.journal.create({ data: json });
  return NextResponse.json(data);
}
