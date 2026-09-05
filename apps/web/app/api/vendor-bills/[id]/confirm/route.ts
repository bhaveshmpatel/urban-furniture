import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { postFromVendorBill } from "@repo/core";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const data = await prisma.vendorBill.update({ where: { id: params.id }, data: { status: "CONFIRMED" } });
  await postFromVendorBill(data.id);
  return NextResponse.json(data);
}
