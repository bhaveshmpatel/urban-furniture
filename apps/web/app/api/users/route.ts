import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import bcrypt from "bcryptjs";

export async function GET() {
  const data = await prisma.user.findMany({
    include: { contact: true },
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json(data);
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
