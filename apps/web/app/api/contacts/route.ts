import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { withPagination } from "@repo/core";

export async function GET(req: Request) {
  const result = await withPagination(req, prisma.contact, { filterField: 'type', searchFields: ['name', 'email', 'phone'] });
  return NextResponse.json(result);
}
export async function POST(req: Request) {
  const json = await req.json();
  const data = await prisma.contact.create({ data: json });
  return NextResponse.json(data);
}
