import { NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function GET() {
  const data = await prisma.payment.findMany({
    include: { contact: true, vendorBill: true, customerInvoice: true },
    orderBy: { paymentDate: "desc" }
  });
  return NextResponse.json(data);
}
