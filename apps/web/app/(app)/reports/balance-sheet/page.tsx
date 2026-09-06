"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Printer } from "lucide-react";
import { PrintDocument, PrintHeader, PrintFooter } from "@/components/print/PrintDocument";

const YEARS = [2024, 2025, 2026, 2027];

export default function BalanceSheetPage() {
  const router = useRouter();
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData(year);
  }, [year]);

  const fetchData = async (y: string) => {
    setLoading(true);
    const res = await fetch(`/api/reports/balance-sheet?year=${y}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  };

  const [showPrint, setShowPrint] = useState(false);
  const handlePrint = () => setShowPrint(true);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Loading...</div>;

  // Use the last month's data as the annual snapshot
  const yearEndData = data?.months?.[11] || { assets: [], liabilities: [], equity: [] };

  const assets = yearEndData.assets || [];
  const liabilities = yearEndData.liabilities || [];
  const equity = yearEndData.equity || [];
  
  // Combine liabilities and equity for the right side
  const rightSideItems = [
    ...liabilities,
    ...equity,
    { accountName: "Retained Earnings", balance: yearEndData.retainedEarnings }
  ].filter(i => Number(i.balance) !== 0);
  
  const leftSideItems = assets.filter((i: any) => Number(i.balance) !== 0);

  // Pad the shorter side so the table rows match up visually
  const rowCount = Math.max(leftSideItems.length, rightSideItems.length);
  const rows = [];
  for (let i = 0; i < rowCount; i++) {
    rows.push({
      asset: leftSideItems[i] || null,
      liability: rightSideItems[i] || null
    });
  }

  const totalAsset = Number(yearEndData.totalAssets || 0);
  const totalLiability = Number(yearEndData.totalLiabilitiesAndEquity || 0);
  const isBalanced = Math.abs(totalAsset - totalLiability) < 0.01;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Standard App Header */}
      <div className="flex justify-between items-center mb-8 print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Balance Sheet</h1>
            <p className="text-gray-500 text-sm">Statement of Financial Position for {year}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-32 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <a href={`/api/reports/balance-sheet/csv?year=${year}`} download>
            <Button variant="outline">CSV</Button>
          </a>
          <Button variant="default" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" /> Print
          </Button>
        </div>
      </div>

      {/* Two Column Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-left border-collapse table-fixed">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="w-1/2 p-4 font-semibold text-gray-500 text-sm uppercase tracking-wider border-r border-gray-200">Assets</th>
              <th className="w-1/2 p-4 font-semibold text-gray-500 text-sm uppercase tracking-wider">Liabilities & Equity</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50/50">
                <td className="p-4 border-r border-gray-200 align-top">
                  {row.asset && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">{row.asset.accountName}</span>
                      <span className="text-gray-600">₹{Number(row.asset.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                </td>
                <td className="p-4 align-top">
                  {row.liability && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">{row.liability.accountName}</span>
                      <span className="text-gray-600">₹{Number(row.liability.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            
            {/* Empty space filler for layout esthetics */}
            <tr className="h-48 border-b border-gray-200">
              <td className="border-r border-gray-200"></td>
              <td></td>
            </tr>

            {/* Footer Totals */}
            <tr className="bg-gray-100 text-lg">
              <td className="p-4 font-bold text-gray-900 border-r border-gray-300">
                <div className="flex justify-between">
                  <span>Total Assets</span>
                  <span>₹{totalAsset.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </td>
              <td className="p-4 font-bold text-gray-900">
                <div className="flex justify-between">
                  <span>Total Liabilities & Equity</span>
                  <span className={isBalanced ? "text-gray-900" : "text-red-600"}>
                    ₹{totalLiability.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Print overlay ── */}
      {showPrint && (
        <PrintDocument onClose={() => setShowPrint(false)}>
          <div className="p-12 max-w-[210mm] mx-auto">
            <PrintHeader title="Balance Sheet" docNumber={`FY ${year}`} />
            <p className="text-sm text-gray-500 mb-6">Statement of Financial Position as at 31 Dec {year}</p>
            <table className="w-full text-sm border-collapse mb-8">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-2 border border-gray-300 w-1/2">Assets</th>
                  <th className="text-left p-2 border border-gray-300 w-1/2">Liabilities & Equity</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row: any, i: number) => (
                  <tr key={i}>
                    <td className="p-2 border border-gray-300 align-top">
                      {row.asset && (
                        <div className="flex justify-between">
                          <span>{row.asset.accountName}</span>
                          <span>₹{Number(row.asset.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-2 border border-gray-300 align-top">
                      {row.liability && (
                        <div className="flex justify-between">
                          <span>{row.liability.accountName}</span>
                          <span>₹{Number(row.liability.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-100 font-bold">
                  <td className="p-2 border border-gray-300">
                    <div className="flex justify-between">
                      <span>Total Assets</span>
                      <span>₹{totalAsset.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </td>
                  <td className="p-2 border border-gray-300">
                    <div className="flex justify-between">
                      <span>Total Liabilities & Equity</span>
                      <span className={isBalanced ? "" : "text-red-600"}>₹{totalLiability.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <PrintFooter note={isBalanced ? "Balance sheet is balanced." : "⚠ Balance sheet is NOT balanced — please review journal entries."} />
          </div>
        </PrintDocument>
      )}
    </div>
  );
}
