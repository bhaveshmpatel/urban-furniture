import { NextRequest, NextResponse } from "next/server";
import { prisma, PaymentMethod } from "@repo/db";
import { postFromPayment } from "@repo/core";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const json = await req.json();
  
  const bill = await prisma.vendorBill.findUnique({ where: { id: params.id } });
  if (!bill) return NextResponse.json({ error: "Bill not found" }, { status: 404 });
  
  const payment = await prisma.payment.create({
    data: {
      vendorBillId: bill.id,
      contactId: bill.vendorId,
      amount: Number(json.amount),
      method: json.method as PaymentMethod,
      paymentDate: new Date()
    }
  });
  
  await postFromPayment(payment.id);
  
  // Recompute bill status based on total payments
  const allPayments = await prisma.payment.findMany({ where: { vendorBillId: bill.id } });
  const paidAmount = allPayments.reduce((acc, p) => acc + Number(p.amount), 0);
  
  let status = bill.status;
  if (paidAmount >= Number(bill.totalAmount)) {
    status = "PAID";
  } else if (paidAmount > 0) {
    status = "PARTIALLY_PAID";
  }
  
  await prisma.vendorBill.update({ where: { id: bill.id }, data: { status } });
  
  return NextResponse.json({ success: true, payment });
}
