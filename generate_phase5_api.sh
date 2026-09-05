#!/bin/bash
mkdir -p apps/web/app/api/purchase-orders/\[id\]/confirm
mkdir -p apps/web/app/api/purchase-orders/\[id\]/create-bill
mkdir -p apps/web/app/api/vendor-bills/\[id\]/confirm
mkdir -p apps/web/app/api/vendor-bills/\[id\]/cancel
mkdir -p apps/web/app/api/vendor-bills/\[id\]/pay

cat << 'EOF' > apps/web/app/api/purchase-orders/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function GET() {
  const data = await prisma.purchaseOrder.findMany({ include: { vendor: true, bill: true }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json(data);
}
export async function POST(req: Request) {
  const json = await req.json();
  const data = await prisma.purchaseOrder.create({ 
    data: {
      vendorId: json.vendorId,
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

cat << 'EOF' > apps/web/app/api/purchase-orders/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const data = await prisma.purchaseOrder.findUnique({ where: { id: params.id }, include: { vendor: true, lines: { include: { product: true } }, bill: true } });
  return NextResponse.json(data);
}
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const json = await req.json();
  // We'll just delete existing lines and recreate them for simplicity
  await prisma.purchaseOrderLine.deleteMany({ where: { purchaseOrderId: params.id } });
  const data = await prisma.purchaseOrder.update({ 
    where: { id: params.id }, 
    data: {
      vendorId: json.vendorId,
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

cat << 'EOF' > apps/web/app/api/purchase-orders/[id]/confirm/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const data = await prisma.purchaseOrder.update({ where: { id: params.id }, data: { status: "CONFIRMED" } });
  return NextResponse.json(data);
}
EOF

cat << 'EOF' > apps/web/app/api/purchase-orders/[id]/create-bill/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const po = await prisma.purchaseOrder.findUnique({ where: { id: params.id }, include: { lines: true } });
  if (!po) return NextResponse.json({ error: "PO not found" }, { status: 404 });
  
  const total = po.lines.reduce((acc, l) => acc + (Number(l.quantity) * Number(l.unitPrice)), 0);

  const bill = await prisma.vendorBill.create({
    data: {
      vendorId: po.vendorId,
      purchaseOrderId: po.id,
      invoiceDate: new Date(),
      dueDate: new Date(),
      totalAmount: total,
      taxAmount: 0,
      lines: {
        create: po.lines.map(l => ({
          productId: l.productId,
          analyticAccountId: l.analyticAccountId,
          quantity: Number(l.quantity),
          unitPrice: Number(l.unitPrice)
        }))
      }
    }
  });
  return NextResponse.json(bill);
}
EOF

cat << 'EOF' > apps/web/app/api/vendor-bills/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function GET() {
  const data = await prisma.vendorBill.findMany({ include: { vendor: true, purchaseOrder: true }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json(data);
}
export async function POST(req: Request) {
  const json = await req.json();
  const data = await prisma.vendorBill.create({ 
    data: {
      vendorId: json.vendorId,
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

cat << 'EOF' > apps/web/app/api/vendor-bills/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const data = await prisma.vendorBill.findUnique({ where: { id: params.id }, include: { vendor: true, lines: { include: { product: true } }, purchaseOrder: true } });
  return NextResponse.json(data);
}
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const json = await req.json();
  await prisma.vendorBillLine.deleteMany({ where: { vendorBillId: params.id } });
  const data = await prisma.vendorBill.update({ 
    where: { id: params.id }, 
    data: {
      vendorId: json.vendorId,
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

cat << 'EOF' > apps/web/app/api/vendor-bills/[id]/confirm/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { postFromVendorBill } from "@repo/core/src/posting";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const data = await prisma.vendorBill.update({ where: { id: params.id }, data: { status: "CONFIRMED" } });
  await postFromVendorBill(data.id);
  return NextResponse.json(data);
}
EOF

cat << 'EOF' > apps/web/app/api/vendor-bills/[id]/cancel/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const data = await prisma.vendorBill.update({ where: { id: params.id }, data: { status: "CANCELLED" } });
  return NextResponse.json(data);
}
EOF

cat << 'EOF' > apps/web/app/api/vendor-bills/[id]/pay/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma, PaymentMethod } from "@repo/db";
import { postFromPayment } from "@repo/core/src/posting";

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
EOF
