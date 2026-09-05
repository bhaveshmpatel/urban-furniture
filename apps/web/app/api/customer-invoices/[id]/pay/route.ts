import { NextRequest, NextResponse } from "next/server";
import { prisma, PaymentMethod } from "@repo/db";
import { postFromPayment } from "@repo/core";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const json = await req.json();
  
  const invoice = await prisma.customerInvoice.findUnique({ where: { id: params.id } });
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  
  const payment = await prisma.payment.create({
    data: {
      customerInvoiceId: invoice.id,
      contactId: invoice.customerId,
      amount: Number(json.amount),
      method: json.method as PaymentMethod,
      paymentDate: new Date()
    }
  });
  
  await postFromPayment(payment.id);
  
  const allPayments = await prisma.payment.findMany({ where: { customerInvoiceId: invoice.id } });
  const paidAmount = allPayments.reduce((acc, p) => acc + Number(p.amount), 0);
  
  let status = invoice.status;
  if (paidAmount >= Number(invoice.totalAmount)) {
    status = "PAID";
  } else if (paidAmount > 0) {
    status = "PARTIALLY_PAID";
  }
  
  await prisma.customerInvoice.update({ where: { id: invoice.id }, data: { status } });
  
  return NextResponse.json({ success: true, payment });
}
