import { NextRequest, NextResponse } from "next/server";
import { computeProfitAndLoss } from "@repo/core";

export async function GET(req: NextRequest) {
  try {
    const year = Number(req.nextUrl.searchParams.get("year") || new Date().getFullYear());
    const data = await computeProfitAndLoss(new Date(year, 0, 1), new Date(year, 11, 31));
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
