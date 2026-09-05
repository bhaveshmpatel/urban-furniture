import { NextRequest, NextResponse } from "next/server";
import { computeProfitAndLoss } from "@repo/core";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const yearStr = searchParams.get("year");
  if (!yearStr) return NextResponse.json({ error: "year is required" }, { status: 400 });

  const year = parseInt(yearStr);
  const data = await computeProfitAndLoss(new Date(year, 0, 1), new Date(year, 11, 31));
  
  let csv = "Account Name,Type,Balance\n";
  const addLine = (name: string, type: string, bal: string) => {
    csv += `"${name}","${type}",${bal}\n`;
  };
  
  data.incomeAccounts.forEach((a: any) => addLine(a.accountName, "INCOME", a.balance));
  data.expenseAccounts.forEach((a: any) => addLine(a.accountName, "EXPENSE", a.balance));
  
  csv += `\n"NET PROFIT","",${data.netProfit}\n`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="profit_and_loss_${year}.csv"`
    }
  });
}
