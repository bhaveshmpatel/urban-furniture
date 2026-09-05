import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { withPagination } from "@repo/core";

export async function GET(req: Request) {
  const result = await withPagination(req, prisma.product, { filterField: 'type', searchFields: ['name', 'sku'] });
  return NextResponse.json(result);
}
export async function POST(req: Request) {
  const json = await req.json();
  const data = await prisma.product.create({ data: json });
  return NextResponse.json(data);
}
