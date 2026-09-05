"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Printer } from "lucide-react";

const YEARS = [2024, 2025, 2026, 2027];

export default function ProfitAndLossPage() {
  const router = useRouter();
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData(year);
  }, [year]);

  const fetchData = async (y: string) => {
    setLoading(true);
    const res = await fetch(`/api/reports/profit-and-loss?year=${y}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  };

  const handlePrint = () => window.print();

  if (loading) return <div className="flex items-center justify-center h-64">Loading...</div>;

  const netProfit = Number(data?.netProfit || 0);
  const isProfit = netProfit >= 0;

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Profit & Loss</h1>
            <p className="text-gray-500 text-sm">Statement of Income & Expenses</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              {YEARS.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <a href={`/api/reports/profit-and-loss/csv?year=${year}`} download>
            <Button variant="outline">CSV</Button>
          </a>
          <Button variant="outline" onClick={handlePrint}><Printer className="h-4 w-4 mr-2" /> Print</Button>
        </div>
      </div>

      {/* Report */}
      <div className="bg-white rounded-xl shadow-sm border p-8">
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold">Urban Furniture</h2>
          <p className="text-gray-500">Profit & Loss Statement — {year}</p>
        </div>

        {/* Income */}
        <div className="mb-6">
          <div className="flex justify-between items-center py-2 border-b-2 border-gray-800 mb-3">
            <h3 className="font-bold text-gray-800 uppercase text-sm tracking-wide">Income</h3>
          </div>
          {data?.incomeAccounts?.length === 0 ? (
            <div className="text-gray-400 text-sm py-2 pl-4">No income recorded</div>
          ) : (
            data?.incomeAccounts?.map((a: any) => (
              <div key={a.accountId} className="flex justify-between py-2 pl-4">
                <span className="text-gray-700">{a.accountName}</span>
                <span className="font-medium">₹{Number(a.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            ))
          )}
          <div className="flex justify-between py-2 pl-4 border-t font-semibold mt-1">
            <span>Total Income</span>
            <span className="text-green-700">₹{Number(data?.totalIncome || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Expenses */}
        <div className="mb-6">
          <div className="flex justify-between items-center py-2 border-b-2 border-gray-800 mb-3">
            <h3 className="font-bold text-gray-800 uppercase text-sm tracking-wide">Expenses</h3>
          </div>
          {data?.expenseAccounts?.length === 0 ? (
            <div className="text-gray-400 text-sm py-2 pl-4">No expenses recorded</div>
          ) : (
            data?.expenseAccounts?.map((a: any) => (
              <div key={a.accountId} className="flex justify-between py-2 pl-4">
                <span className="text-gray-700">{a.accountName}</span>
                <span className="font-medium">₹{Number(a.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            ))
          )}
          <div className="flex justify-between py-2 pl-4 border-t font-semibold mt-1">
            <span>Total Expenses</span>
            <span className="text-red-700">₹{Number(data?.totalExpenses || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Net Income */}
        <div className={`flex justify-between py-4 px-4 rounded-lg font-bold text-lg mt-4 ${isProfit ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          <span>{isProfit ? 'Net Profit' : 'Net Loss'}</span>
          <span>₹{Math.abs(netProfit).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
      </div>
    </div>
  );
}
