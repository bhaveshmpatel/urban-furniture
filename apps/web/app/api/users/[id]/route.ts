import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import bcrypt from "bcryptjs";

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const json = await req.json();
  const { password, ...rest } = json;
  
  if (password) {
    rest.passwordHash = await bcrypt.hash(password, 12);
  }
  
  const data = await prisma.user.update({ where: { id: params.id }, data: rest });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const data = await prisma.user.update({ where: { id: params.id }, data: { isActive: false } });
  return NextResponse.json(data);
}
