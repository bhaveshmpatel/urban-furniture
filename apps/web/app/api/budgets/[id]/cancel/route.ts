import { NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try { const params = await context.params;
    const budget = await prisma.budget.update({
      where: { id: params.id },
      data: { status: "CANCELLED" },
    });
    return NextResponse.json(budget);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
