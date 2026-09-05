import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@repo/db';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const data = await req.json();
    const existingByLoginId = await prisma.user.findUnique({ where: { loginId: data.loginId } });
    if (existingByLoginId) return NextResponse.json({ error: 'Conflict', message: 'Login ID is already taken' }, { status: 409 });
    
    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        loginId: data.loginId,
        email: data.email,
        passwordHash,
        role: 'ACCOUNTANT',
      },
    });
    return NextResponse.json({ success: true, userId: user.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
