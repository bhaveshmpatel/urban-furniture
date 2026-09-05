import { NextRequest, NextResponse } from "next/server";
import { computeBalanceSheet } from "@repo/core";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const yearStr = searchParams.get("year");
  if (!yearStr) return NextResponse.json({ error: "year is required" }, { status: 400 });

  const year = parseInt(yearStr);
  const data = await computeBalanceSheet(new Date(year, 11, 31));
  
  let csv = "Category,Account Name,Balance\n";
  const addLine = (cat: string, name: string, bal: string) => {
    csv += `"${cat}","${name}",${bal}\n`;
  };
  
  data.assets.forEach((a: any) => addLine("ASSET", a.accountName, a.balance));
  csv += `"TOTAL ASSETS","",${data.totalAssets}\n\n`;
  
  data.liabilities.forEach((a: any) => addLine("LIABILITY", a.accountName, a.balance));
  csv += `"TOTAL LIABILITIES","",${data.totalLiabilities}\n`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="balance_sheet_${year}.csv"`
    }
  });
}
