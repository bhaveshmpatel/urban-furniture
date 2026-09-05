import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { budgetSchema } from "@repo/validators";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try { const params = await context.params;
    const budget = await prisma.budget.findUnique({
      where: { id: params.id },
      include: {
        analyticAccount: true,
        responsiblePerson: true,
      },
    });
    if (!budget) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(budget);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try { const params = await context.params;
    const json = await req.json();
    const parsed = budgetSchema.parse(json);

    const updated = await prisma.budget.update({
      where: { id: params.id },
      data: {
        name: parsed.name,
        periodStart: parsed.periodStart,
        periodEnd: parsed.periodEnd,
        committedAmount: parsed.committedAmount,
        analyticAccountId: parsed.analyticAccountId,
        responsibleContactId: parsed.responsibleContactId,
      },
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try { const params = await context.params;
    await prisma.budget.delete({ where: { id: params.id } });
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
