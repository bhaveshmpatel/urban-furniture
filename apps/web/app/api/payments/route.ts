import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { withPagination } from "@repo/core";

export async function GET(req: Request) {
  try {
    const result = await withPagination(req, prisma.payment, {
      include: { contact: true, vendorBill: true, customerInvoice: true },
      orderByField: 'paymentDate',
      searchFields: ['id']
    });

    const isPaginated = req.url.includes("paginate=true");
    if (isPaginated) {
      return NextResponse.json(result);
    }
    return NextResponse.json({ data: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
