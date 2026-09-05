import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getSession } from "@repo/auth";
import { postFromPayment } from "@repo/core";
import { Decimal } from "decimal.js";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const contactId = (session.user as any).contactId;
    if (!contactId) return NextResponse.json({ error: "No associated contact" }, { status: 403 });

    const json = await req.json();
    const { documentId, documentType, amount, method } = json;

    if (!documentId || !documentType || !amount || !method) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const payAmount = new Decimal(amount);

    let doc: any = null;
    let fieldToUpdate = "";
    if (documentType === "VENDOR_BILL") {
      doc = await prisma.vendorBill.findUnique({ where: { id: documentId } });
      if (!doc || doc.vendorId !== contactId) {
         return NextResponse.json({ error: "Not authorized or not found" }, { status: 403 });
      }
      fieldToUpdate = "vendorBillId";
    } else if (documentType === "CUSTOMER_INVOICE") {
      doc = await prisma.customerInvoice.findUnique({ where: { id: documentId } });
      if (!doc || doc.customerId !== contactId) {
         return NextResponse.json({ error: "Not authorized or not found" }, { status: 403 });
      }
      fieldToUpdate = "customerInvoiceId";
    } else {
      return NextResponse.json({ error: "Invalid document type" }, { status: 400 });
    }

    if (doc.status === "PAID") {
      return NextResponse.json({ error: "Already paid" }, { status: 400 });
    }

    const payment = await prisma.payment.create({
      data: {
        contactId, // Pre-locked Partner = self, cannot be changed
        method,
        amount: payAmount.toNumber(),
        [fieldToUpdate]: documentId
      }
    });

    const isCustomer = documentType === "CUSTOMER_INVOICE";
    
    // Post to ledger
    await postFromPayment(payment.id);

    const newPaid = new Decimal(doc.amountPaid.toString()).plus(payAmount);
    const newStatus = newPaid.gte(new Decimal(doc.totalAmount.toString())) ? "PAID" : "PARTIALLY_PAID";

    if (documentType === "VENDOR_BILL") {
      await prisma.vendorBill.update({
        where: { id: documentId },
        data: { amountPaid: newPaid.toNumber(), status: newStatus }
      });
    } else {
      await prisma.customerInvoice.update({
        where: { id: documentId },
        data: { amountPaid: newPaid.toNumber(), status: newStatus }
      });
    }

    return NextResponse.json({ success: true, payment });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
