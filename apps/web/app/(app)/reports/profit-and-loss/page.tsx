"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Printer, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PrintDocument, PrintHeader, PrintFooter } from "@/components/print/PrintDocument";

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

  const [showPrint, setShowPrint] = useState(false);
  const handlePrint = () => setShowPrint(true);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Loading...</div>;

  const yearly = data?.yearly || { incomeAccounts: [], expenseAccounts: [] };
  const incomeItems = (yearly.incomeAccounts || []).filter((i: any) => Number(i.balance) !== 0);
  const expenseItems = (yearly.expenseAccounts || []).filter((i: any) => Number(i.balance) !== 0);

  const totalIncome = Number(yearly.totalIncome || 0);
  const totalExpense = Number(yearly.totalExpenses || 0); // it's totalExpenses in the API
  const netIncome = Number(yearly.netProfit || 0); // it's netProfit in the API

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Standard App Header */}
      <div className="flex justify-between items-center mb-8 print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Profit & Loss</h1>
            <p className="text-gray-500 text-sm">Income Statement for {year}</p>
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
          <a href={`/api/reports/profit-and-loss/csv?year=${year}`} download>
            <Button variant="outline">CSV</Button>
          </a>
          <Button variant="default" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" /> Print
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-6 mb-8 print:grid-cols-3 print:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              ₹{totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              ₹{totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card className={netIncome >= 0 ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className={`text-sm font-bold ${netIncome >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              Net Income
            </CardTitle>
            <DollarSign className={`h-4 w-4 ${netIncome >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netIncome >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              ₹{netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statement Tables Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Income Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-4 text-left font-semibold text-gray-500 text-sm uppercase tracking-wider">Income Account</th>
                <th className="p-4 text-right font-semibold text-gray-500 text-sm uppercase tracking-wider">Balance</th>
              </tr>
            </thead>
            <tbody>
              {incomeItems.length === 0 ? (
                <tr className="border-b border-gray-100">
                  <td colSpan={2} className="p-4 text-center text-gray-400 italic">No income records</td>
                </tr>
              ) : (
                incomeItems.map((item: any) => (
                  <tr key={item.accountId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4 pl-4 text-gray-700">{item.accountName}</td>
                    <td className="p-4 text-right text-gray-600">
                      ₹{Number(item.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
              <tr className="bg-emerald-50 border-t border-emerald-100">
                <td className="p-4 font-bold text-emerald-800">Total Income</td>
                <td className="p-4 text-right font-bold text-emerald-800">
                  ₹{totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Expenses Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-4 text-left font-semibold text-gray-500 text-sm uppercase tracking-wider">Expense Account</th>
                <th className="p-4 text-right font-semibold text-gray-500 text-sm uppercase tracking-wider">Balance</th>
              </tr>
            </thead>
            <tbody>
              {expenseItems.length === 0 ? (
                <tr className="border-b border-gray-100">
                  <td colSpan={2} className="p-4 text-center text-gray-400 italic">No expense records</td>
                </tr>
              ) : (
                expenseItems.map((item: any) => (
                  <tr key={item.accountId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4 pl-4 text-gray-700">{item.accountName}</td>
                    <td className="p-4 text-right text-gray-600">
                      ₹{Number(item.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
              <tr className="bg-red-50 border-t border-red-100">
                <td className="p-4 font-bold text-red-800">Total Expenses</td>
                <td className="p-4 text-right font-bold text-red-800">
                  ₹{totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-gray-900 text-white rounded-xl shadow-sm overflow-hidden flex justify-between items-center p-6 mb-8">
        <div className="font-bold text-xl">Net Income</div>
        <div className="font-bold text-xl">
          ₹{netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </div>
      </div>

      {/* ── Print overlay ── */}
      {showPrint && (
        <PrintDocument onClose={() => setShowPrint(false)}>
          <div className="p-12 max-w-[210mm] mx-auto">
            <PrintHeader title="Profit & Loss Statement" docNumber={`FY ${year}`} />
            <p className="text-sm text-gray-500 mb-6">Income Statement for the year ended 31 Dec {year}</p>
            <table className="w-full text-sm border-collapse mb-8">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-2 border border-gray-300">Account</th>
                  <th className="text-right p-2 border border-gray-300 w-36">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-gray-50">
                  <td className="p-2 border border-gray-300 font-bold">Income</td>
                  <td className="p-2 border border-gray-300 text-right font-bold">₹{totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
                {incomeItems.map((item: any) => (
                  <tr key={item.accountId}>
                    <td className="p-2 border border-gray-300 pl-6">{item.accountName}</td>
                    <td className="p-2 border border-gray-300 text-right">₹{Number(item.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
                <tr className="bg-gray-50">
                  <td className="p-2 border border-gray-300 font-bold">Expenses</td>
                  <td className="p-2 border border-gray-300 text-right font-bold">₹{totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
                {expenseItems.map((item: any) => (
                  <tr key={item.accountId}>
                    <td className="p-2 border border-gray-300 pl-6">{item.accountName}</td>
                    <td className="p-2 border border-gray-300 text-right">₹{Number(item.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
                <tr className="bg-gray-900 text-white font-bold">
                  <td className="p-2 border border-gray-700">Net Income / (Loss)</td>
                  <td className="p-2 border border-gray-700 text-right">₹{netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>
            <PrintFooter note={netIncome >= 0 ? "Profitable year — well done!" : "Net loss for the period."} />
          </div>
        </PrintDocument>
      )}
    </div>
  );
}
