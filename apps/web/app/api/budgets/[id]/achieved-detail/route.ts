export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getBudgetAchievedDetail } from "@repo/core";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const details = await getBudgetAchievedDetail(params.id);
    return NextResponse.json(details);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
