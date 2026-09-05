import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getSession } from "@repo/auth";

export async function GET() {
  const session = await getSession();
  if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contactId = (session.user as any).contactId;
  if (!contactId) return NextResponse.json({ error: "No associated contact" }, { status: 403 });

  // Get bills and invoices for this contact
  const [bills, invoices] = await Promise.all([
    prisma.vendorBill.findMany({
      where: { vendorId: contactId },
      include: { vendor: true, purchaseOrder: true },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.customerInvoice.findMany({
      where: { customerId: contactId },
      include: { customer: true, salesOrder: true },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  const documents = [
    ...bills.map(b => ({ ...b, documentType: "VENDOR_BILL" as const })),
    ...invoices.map(i => ({ ...i, documentType: "CUSTOMER_INVOICE" as const }))
  ];

  // sort globally by date desc
  documents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json(documents);
}
