import { NextRequest, NextResponse } from "next/server";
import { computeBalanceSheet } from "@repo/core";

export async function GET(req: NextRequest) {
  try {
    const year = Number(req.nextUrl.searchParams.get("year") || new Date().getFullYear());
    
    // We will compute for all 12 months
    const monthlyData = [];
    for (let m = 0; m < 12; m++) {
      const lastDay = new Date(year, m + 1, 0, 23, 59, 59);
      const data = await computeBalanceSheet(lastDay);
      monthlyData.push(data);
    }

    return NextResponse.json({ year, months: monthlyData });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
