import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { withPagination } from "@repo/core";
import bcrypt from "bcryptjs";

export async function GET(req: Request) {
  const result = await withPagination(req, prisma.user, { include: { contact: true }, searchFields: ['name', 'email'] });
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const json = await req.json();
  const { password, ...rest } = json;
  
  if (password) {
    rest.passwordHash = await bcrypt.hash(password, 12);
  } else {
    rest.passwordHash = await bcrypt.hash("User@1234", 12);
  }
  
  const user = await prisma.user.create({ data: rest });
  return NextResponse.json(user);
}
