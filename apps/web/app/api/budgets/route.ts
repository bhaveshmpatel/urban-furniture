import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { budgetSchema } from "@repo/validators";
import { computeAchievedAmount } from "@repo/core";

export async function GET() {
  try {
    const budgets = await prisma.budget.findMany({
      include: {
        analyticAccount: true,
        responsiblePerson: true,
        revisedFrom: true,
        revisedTo: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const enriched = await Promise.all(
      budgets.map(async (b) => {
        const achieved = await computeAchievedAmount(b.id);
        const committedAmount = Number(b.committedAmount);
        const achievedAmount = achieved.toNumber();
        let achievedPercent = 0;
        let amountToAchieve = 0;
        
        if (b.status === "CONFIRMED") {
          achievedPercent = committedAmount > 0 ? (achievedAmount / committedAmount) * 100 : 0;
          amountToAchieve = committedAmount - achievedAmount;
        }

        return {
          ...b,
          achievedAmount,
          achievedPercent,
          amountToAchieve,
        };
      })
    );

    return NextResponse.json(enriched);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = budgetSchema.parse(json);

    const budget = await prisma.budget.create({
      data: {
        name: parsed.name,
        periodStart: parsed.periodStart,
        periodEnd: parsed.periodEnd,
        committedAmount: parsed.committedAmount,
        analyticAccountId: parsed.analyticAccountId,
        responsibleContactId: parsed.responsibleContactId,
        status: "DRAFT",
      },
    });
    return NextResponse.json(budget, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
