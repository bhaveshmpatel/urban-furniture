import { NextRequest, NextResponse } from "next/server";
import { computeProfitAndLoss } from "@repo/core";

export async function GET(req: NextRequest) {
  try {
    const year = Number(req.nextUrl.searchParams.get("year") || new Date().getFullYear());
    
    const monthlyData = [];
    for (let m = 0; m < 12; m++) {
      const fromDate = new Date(year, m, 1);
      const toDate = new Date(year, m + 1, 0, 23, 59, 59);
      const data = await computeProfitAndLoss(fromDate, toDate);
      monthlyData.push(data);
    }
    
    const yearly = await computeProfitAndLoss(new Date(year, 0, 1), new Date(year, 11, 31, 23, 59, 59));
    
    return NextResponse.json({ year, months: monthlyData, yearly });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
