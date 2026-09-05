#!/bin/bash
mkdir -p apps/web/app/api/contacts/\[id\]
mkdir -p apps/web/app/api/products/\[id\]
mkdir -p apps/web/app/api/analytic-accounts/\[id\]
mkdir -p apps/web/app/api/accounts/\[id\]
mkdir -p apps/web/app/api/journals/\[id\]

cat << 'EOF' > apps/web/app/api/contacts/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function GET() {
  const data = await prisma.contact.findMany({ where: { isArchived: false } });
  return NextResponse.json(data);
}
export async function POST(req: Request) {
  const json = await req.json();
  const data = await prisma.contact.create({ data: json });
  return NextResponse.json(data);
}
EOF

cat << 'EOF' > apps/web/app/api/contacts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const json = await req.json();
  const data = await prisma.contact.update({ where: { id: params.id }, data: json });
  return NextResponse.json(data);
}
EOF

cat << 'EOF' > apps/web/app/api/products/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function GET() {
  const data = await prisma.product.findMany({ where: { isArchived: false } });
  return NextResponse.json(data);
}
export async function POST(req: Request) {
  const json = await req.json();
  const data = await prisma.product.create({ data: json });
  return NextResponse.json(data);
}
EOF

cat << 'EOF' > apps/web/app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const json = await req.json();
  const data = await prisma.product.update({ where: { id: params.id }, data: json });
  return NextResponse.json(data);
}
EOF

cat << 'EOF' > apps/web/app/api/analytic-accounts/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function GET() {
  const data = await prisma.analyticAccount.findMany();
  return NextResponse.json(data);
}
export async function POST(req: Request) {
  const json = await req.json();
  const data = await prisma.analyticAccount.create({ data: json });
  return NextResponse.json(data);
}
EOF

cat << 'EOF' > apps/web/app/api/analytic-accounts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const json = await req.json();
  const data = await prisma.analyticAccount.update({ where: { id: params.id }, data: json });
  return NextResponse.json(data);
}
EOF

cat << 'EOF' > apps/web/app/api/accounts/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function GET() {
  const data = await prisma.account.findMany();
  return NextResponse.json(data);
}
export async function POST(req: Request) {
  const json = await req.json();
  const data = await prisma.account.create({ data: json });
  return NextResponse.json(data);
}
EOF

cat << 'EOF' > apps/web/app/api/accounts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const json = await req.json();
  const data = await prisma.account.update({ where: { id: params.id }, data: json });
  return NextResponse.json(data);
}
EOF

cat << 'EOF' > apps/web/app/api/journals/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function GET() {
  const data = await prisma.journal.findMany({ include: { defaultAccount: true } });
  return NextResponse.json(data);
}
export async function POST(req: Request) {
  const json = await req.json();
  const data = await prisma.journal.create({ data: json });
  return NextResponse.json(data);
}
EOF

cat << 'EOF' > apps/web/app/api/journals/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const json = await req.json();
  const data = await prisma.journal.update({ where: { id: params.id }, data: json });
  return NextResponse.json(data);
}
EOF

