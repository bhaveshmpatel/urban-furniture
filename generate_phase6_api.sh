#!/bin/bash
mkdir -p apps/web/app/api/sales-orders/\[id\]/confirm
mkdir -p apps/web/app/api/sales-orders/\[id\]/create-invoice
mkdir -p apps/web/app/api/customer-invoices/\[id\]/confirm
mkdir -p apps/web/app/api/customer-invoices/\[id\]/cancel
mkdir -p apps/web/app/api/customer-invoices/\[id\]/pay

cat << 'EOF' > apps/web/app/api/sales-orders/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function GET() {
  const data = await prisma.salesOrder.findMany({ include: { customer: true, invoice: true }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json(data);
}
export async function POST(req: Request) {
  const json = await req.json();
  const data = await prisma.salesOrder.create({ 
    data: {
      customerId: json.customerId,
      orderDate: new Date(json.orderDate),
      lines: {
        create: json.lines.map((l: any) => ({
          productId: l.productId,
          analyticAccountId: l.analyticAccountId || null,
          quantity: Number(l.quantity),
          unitPrice: Number(l.unitPrice)
        }))
      }
    }
  });
  return NextResponse.json(data);
}
EOF

cat << 'EOF' > apps/web/app/api/sales-orders/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const data = await prisma.salesOrder.findUnique({ where: { id: params.id }, include: { customer: true, lines: { include: { product: true } }, invoice: true } });
  return NextResponse.json(data);
}
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const json = await req.json();
  
  await prisma.salesOrderLine.deleteMany({ where: { salesOrderId: params.id } });
  const data = await prisma.salesOrder.update({ 
    where: { id: params.id }, 
    data: {
      customerId: json.customerId,
      orderDate: new Date(json.orderDate),
      lines: {
        create: json.lines.map((l: any) => ({
          productId: l.productId,
          analyticAccountId: l.analyticAccountId || null,
          quantity: Number(l.quantity),
          unitPrice: Number(l.unitPrice)
        }))
      }
    }
  });
  return NextResponse.json(data);
}
EOF

cat << 'EOF' > apps/web/app/api/sales-orders/[id]/confirm/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const data = await prisma.salesOrder.update({ where: { id: params.id }, data: { status: "CONFIRMED" } });
  return NextResponse.json(data);
}
EOF

cat << 'EOF' > apps/web/app/api/sales-orders/[id]/create-invoice/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const so = await prisma.salesOrder.findUnique({ where: { id: params.id }, include: { lines: true } });
  if (!so) return NextResponse.json({ error: "SO not found" }, { status: 404 });
  
  const total = so.lines.reduce((acc, l) => acc + (Number(l.quantity) * Number(l.unitPrice)), 0);

  const invoice = await prisma.customerInvoice.create({
    data: {
      customerId: so.customerId,
      salesOrderId: so.id,
      invoiceDate: new Date(),
      dueDate: new Date(),
      totalAmount: total,
      taxAmount: 0,
      lines: {
        create: so.lines.map(l => ({
          productId: l.productId,
          analyticAccountId: l.analyticAccountId,
          quantity: Number(l.quantity),
          unitPrice: Number(l.unitPrice)
        }))
      }
    }
  });
  return NextResponse.json(invoice);
}
EOF

cat << 'EOF' > apps/web/app/api/customer-invoices/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function GET() {
  const data = await prisma.customerInvoice.findMany({ include: { customer: true, salesOrder: true }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json(data);
}
export async function POST(req: Request) {
  const json = await req.json();
  const data = await prisma.customerInvoice.create({ 
    data: {
      customerId: json.customerId,
      invoiceDate: new Date(json.invoiceDate),
      dueDate: new Date(json.dueDate),
      totalAmount: Number(json.totalAmount),
      taxAmount: Number(json.taxAmount || 0),
      lines: {
        create: json.lines.map((l: any) => ({
          productId: l.productId,
          analyticAccountId: l.analyticAccountId || null,
          quantity: Number(l.quantity),
          unitPrice: Number(l.unitPrice)
        }))
      }
    }
  });
  return NextResponse.json(data);
}
EOF

cat << 'EOF' > apps/web/app/api/customer-invoices/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const data = await prisma.customerInvoice.findUnique({ where: { id: params.id }, include: { customer: true, lines: { include: { product: true } }, salesOrder: true } });
  return NextResponse.json(data);
}
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const json = await req.json();
  
  await prisma.customerInvoiceLine.deleteMany({ where: { invoiceId: params.id } });
  const data = await prisma.customerInvoice.update({ 
    where: { id: params.id }, 
    data: {
      customerId: json.customerId,
      invoiceDate: new Date(json.invoiceDate),
      dueDate: new Date(json.dueDate),
      totalAmount: Number(json.totalAmount),
      taxAmount: Number(json.taxAmount || 0),
      lines: {
        create: json.lines.map((l: any) => ({
          productId: l.productId,
          analyticAccountId: l.analyticAccountId || null,
          quantity: Number(l.quantity),
          unitPrice: Number(l.unitPrice)
        }))
      }
    }
  });
  return NextResponse.json(data);
}
EOF

cat << 'EOF' > apps/web/app/api/customer-invoices/[id]/confirm/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { postFromCustomerInvoice } from "@repo/core";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const data = await prisma.customerInvoice.update({ where: { id: params.id }, data: { status: "CONFIRMED" } });
  await postFromCustomerInvoice(data.id);
  return NextResponse.json(data);
}
EOF

cat << 'EOF' > apps/web/app/api/customer-invoices/[id]/cancel/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const data = await prisma.customerInvoice.update({ where: { id: params.id }, data: { status: "CANCELLED" } });
  return NextResponse.json(data);
}
EOF

cat << 'EOF' > apps/web/app/api/customer-invoices/[id]/pay/route.ts
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
EOF
