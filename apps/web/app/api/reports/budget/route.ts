export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { computeAchievedAmount } from "@repo/core";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let where: any = {};
    if (status) {
      where.status = status;
    }

    const budgets = await prisma.budget.findMany({
      where,
      include: {
        analyticAccount: true,
        revisedFrom: true,
        revisedTo: true,
      },
      orderBy: { periodStart: "asc" },
    });

    const results = await Promise.all(
      budgets.map(async (b) => {
        const achieved = await computeAchievedAmount(b.id);
        const achievedAmount = achieved.toNumber();
        const committedAmount = Number(b.committedAmount);
        
        let balance = 0;
        if (b.status === 'CONFIRMED' || b.status === 'REVISED') {
          balance = committedAmount - achievedAmount;
        }

        return {
          ...b,
          achievedAmount,
          balance,
        };
      })
    );

    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
