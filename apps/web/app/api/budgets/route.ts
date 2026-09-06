export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { withPagination } from "@repo/core";
import { budgetSchema } from "@repo/validators";
import { computeAchievedAmount } from "@repo/core";

export async function GET(req: Request) {
  try {
    const result = await withPagination(req, prisma.budget, {
      include: {
        analyticAccount: true,
        responsiblePerson: true,
        revisedFrom: true,
        revisedTo: true,
      },
      orderByField: 'createdAt',
      filterField: 'status',
      searchFields: ['name', 'analyticAccount.name']
    });

    const isPaginated = req.url.includes("paginate=true");
    const arrayToEnrich = isPaginated ? (result as any).data : result as any;

    const enriched = await Promise.all(
      arrayToEnrich.map(async (b: any) => {
        const achieved = await computeAchievedAmount(b.id);
        const committedAmount = Number(b.committedAmount);
        const achievedAmount = achieved.toNumber();
        let achievedPercent = 0;
        let amountToAchieve = 0;
        
        if (b.status === "CONFIRMED" || b.status === "REVISED") {
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

    if (isPaginated) {
      return NextResponse.json({ data: enriched, metadata: (result as any).metadata });
    }
    return NextResponse.json(enriched);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = budgetSchema.parse(json);

    const analyticAccount = await prisma.analyticAccount.findUnique({
      where: { id: parsed.analyticAccountId }
    });
    if (!analyticAccount) {
      return NextResponse.json({ error: "Analytic account not found" }, { status: 400 });
    }

    const budget = await prisma.budget.create({
      data: {
        name: parsed.name,
        periodStart: parsed.periodStart,
        periodEnd: parsed.periodEnd,
        committedAmount: parsed.committedAmount,
        analyticAccountId: parsed.analyticAccountId,
        type: analyticAccount.type,
        responsibleContactId: parsed.responsibleContactId,
        status: "DRAFT",
      },
    });
    return NextResponse.json(budget, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
