"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Printer } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const YEARS = [2024, 2025, 2026, 2027];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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

  const months = data?.months || [];
  const yearly = data?.yearly || {};

  // Get unique account IDs across all months
  const incomeMap = new Map();
  const expenseMap = new Map();

  months.forEach((m: any) => {
    m.incomeAccounts?.forEach((a: any) => incomeMap.set(a.accountId, a.accountName));
    m.expenseAccounts?.forEach((a: any) => expenseMap.set(a.accountId, a.accountName));
  });

  const getBalances = (monthsData: any[], accountId: string, type: 'incomeAccounts' | 'expenseAccounts') => {
    return monthsData.map((m: any) => {
      const acc = m[type]?.find((a: any) => a.accountId === accountId);
      return Number(acc?.balance || 0);
    });
  };

  const getYearlyBalance = (accountId: string, type: 'incomeAccounts' | 'expenseAccounts') => {
    const acc = yearly[type]?.find((a: any) => a.accountId === accountId);
    return Number(acc?.balance || 0);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Profit & Loss</h1>
            <p className="text-gray-500 text-sm">Statement of Income & Expenses (Monthly)</p>
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

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <Table className="min-w-[1300px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px] sticky left-0 bg-gray-50 z-10 border-r shadow-[1px_0_0_rgba(0,0,0,0.1)]">Account</TableHead>
              {MONTHS.map(m => (
                <TableHead key={m} className="text-right whitespace-nowrap">{m} {year}</TableHead>
              ))}
              <TableHead className="text-right bg-blue-50 font-bold border-l">Total YTD</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* INCOME */}
            <TableRow className="bg-gray-100 hover:bg-gray-100">
              <TableCell colSpan={14} className="font-bold sticky left-0">INCOME</TableCell>
            </TableRow>
            {Array.from(incomeMap.entries()).map(([id, name]) => (
              <TableRow key={id}>
                <TableCell className="sticky left-0 bg-white border-r shadow-[1px_0_0_rgba(0,0,0,0.1)]">{name}</TableCell>
                {getBalances(months, id, 'incomeAccounts').map((bal, i) => (
                  <TableCell key={i} className="text-right">₹{bal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                ))}
                <TableCell className="text-right bg-blue-50/50 border-l font-medium">₹{getYearlyBalance(id, 'incomeAccounts').toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-green-50 font-semibold">
              <TableCell className="sticky left-0 bg-green-50 border-r shadow-[1px_0_0_rgba(0,0,0,0.1)]">Total Income</TableCell>
              {months.map((m: any, i: number) => (
                <TableCell key={i} className="text-right text-green-700">₹{Number(m.totalIncome || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
              ))}
              <TableCell className="text-right bg-green-100 border-l text-green-800 font-bold">₹{Number(yearly.totalIncome || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
            </TableRow>

            {/* EXPENSES */}
            <TableRow className="bg-gray-100 hover:bg-gray-100">
              <TableCell colSpan={14} className="font-bold sticky left-0">EXPENSES</TableCell>
            </TableRow>
            {Array.from(expenseMap.entries()).map(([id, name]) => (
              <TableRow key={id}>
                <TableCell className="sticky left-0 bg-white border-r shadow-[1px_0_0_rgba(0,0,0,0.1)]">{name}</TableCell>
                {getBalances(months, id, 'expenseAccounts').map((bal, i) => (
                  <TableCell key={i} className="text-right">₹{bal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                ))}
                <TableCell className="text-right bg-blue-50/50 border-l font-medium">₹{getYearlyBalance(id, 'expenseAccounts').toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-red-50 font-semibold">
              <TableCell className="sticky left-0 bg-red-50 border-r shadow-[1px_0_0_rgba(0,0,0,0.1)]">Total Expenses</TableCell>
              {months.map((m: any, i: number) => (
                <TableCell key={i} className="text-right text-red-600">₹{Number(m.totalExpenses || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
              ))}
              <TableCell className="text-right bg-red-100 border-l text-red-700 font-bold">₹{Number(yearly.totalExpenses || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
            </TableRow>

            {/* NET PROFIT */}
            <TableRow className="bg-blue-50 font-bold border-t-2 border-gray-800">
              <TableCell className="sticky left-0 bg-blue-50 border-r shadow-[1px_0_0_rgba(0,0,0,0.1)]">Net Profit</TableCell>
              {months.map((m: any, i: number) => {
                const net = Number(m.netProfit || 0);
                return (
                  <TableCell key={i} className={`text-right ${net >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                    ₹{net.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                );
              })}
              <TableCell className={`text-right bg-blue-100 border-l text-lg ${Number(yearly.netProfit || 0) >= 0 ? 'text-green-800' : 'text-red-700'}`}>
                ₹{Number(yearly.netProfit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
