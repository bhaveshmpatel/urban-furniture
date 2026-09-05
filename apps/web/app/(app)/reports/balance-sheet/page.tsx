"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Printer, AlertTriangle } from "lucide-react";

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

  const handlePrint = () => window.print();

  if (loading) return <div className="flex items-center justify-center h-64">Loading...</div>;

  const totalAssets = Number(data?.totalAssets || 0);
  const totalLiabilitiesAndEquity = Number(data?.totalLiabilitiesAndEquity || 0);
  const isBalanced = Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.01;

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Balance Sheet</h1>
            <p className="text-gray-500 text-sm">Statement of Financial Position</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              {YEARS.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <a href={`/api/reports/balance-sheet/csv?year=${year}`} download>
            <Button variant="outline">CSV</Button>
          </a>
          <Button variant="outline" onClick={handlePrint}><Printer className="h-4 w-4 mr-2" /> Print</Button>
        </div>
      </div>

      {/* Imbalance Warning */}
      {!isBalanced && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-semibold text-amber-800">Balance Sheet does not balance</div>
            <div className="text-sm text-amber-700 mt-1">
              Total Assets (₹{totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}) ≠ 
              Total Liabilities & Equity (₹{totalLiabilitiesAndEquity.toLocaleString(undefined, { minimumFractionDigits: 2 })}).
              Discrepancy: ₹{Math.abs(totalAssets - totalLiabilitiesAndEquity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* Assets */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-gray-800">ASSETS</h2>
          </div>
          <div className="mb-4">
            <div className="font-semibold text-gray-700 mb-2 uppercase text-xs tracking-wide">Current Assets</div>
            {data?.assets?.length === 0 ? (
              <div className="text-gray-400 text-sm pl-2">No asset accounts</div>
            ) : (
              data?.assets?.map((a: any) => (
                <div key={a.accountId} className="flex justify-between py-1.5 pl-2 text-sm">
                  <span className="text-gray-600">{a.accountName}</span>
                  <span className="font-medium">₹{Number(a.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              ))
            )}
          </div>
          <div className="flex justify-between py-3 border-t-2 border-gray-800 font-bold mt-2">
            <span>Total Assets</span>
            <span className="text-blue-700">₹{totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Liabilities & Equity */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-gray-800">LIABILITIES & EQUITY</h2>
          </div>
          <div className="mb-4">
            <div className="font-semibold text-gray-700 mb-2 uppercase text-xs tracking-wide">Liabilities</div>
            {data?.liabilities?.length === 0 ? (
              <div className="text-gray-400 text-sm pl-2">No liability accounts</div>
            ) : (
              data?.liabilities?.map((a: any) => (
                <div key={a.accountId} className="flex justify-between py-1.5 pl-2 text-sm">
                  <span className="text-gray-600">{a.accountName}</span>
                  <span className="font-medium">₹{Number(a.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              ))
            )}
            <div className="flex justify-between py-1.5 pl-2 text-sm font-semibold border-t mt-1">
              <span>Total Liabilities</span>
              <span>₹{Number(data?.totalLiabilities || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
          <div className="mb-4">
            <div className="font-semibold text-gray-700 mb-2 uppercase text-xs tracking-wide mt-4">Equity</div>
            {data?.equity?.map((a: any) => (
              <div key={a.accountId} className="flex justify-between py-1.5 pl-2 text-sm">
                <span className="text-gray-600">{a.accountName}</span>
                <span className="font-medium">₹{Number(a.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            ))}
            {Number(data?.retainedEarnings || 0) !== 0 && (
              <div className="flex justify-between py-1.5 pl-2 text-sm">
                <span className="text-gray-600">Retained Earnings</span>
                <span className="font-medium">₹{Number(data?.retainedEarnings || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex justify-between py-1.5 pl-2 text-sm font-semibold border-t mt-1">
              <span>Total Equity</span>
              <span>₹{Number(data?.totalEquity || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
          <div className="flex justify-between py-3 border-t-2 border-gray-800 font-bold mt-2">
            <span>Total Liabilities & Equity</span>
            <span className={isBalanced ? "text-blue-700" : "text-red-600"}>
              ₹{totalLiabilitiesAndEquity.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
