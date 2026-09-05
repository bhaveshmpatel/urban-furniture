"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Printer } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const YEARS = [2024, 2025, 2026, 2027];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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

  const months = data?.months || [];

  // Get unique account IDs across all months
  const assetMap = new Map();
  const liabilityMap = new Map();
  const equityMap = new Map();

  months.forEach((m: any) => {
    m.assets.forEach((a: any) => assetMap.set(a.accountId, a.accountName));
    m.liabilities.forEach((l: any) => liabilityMap.set(l.accountId, l.accountName));
    m.equity.forEach((e: any) => equityMap.set(e.accountId, e.accountName));
  });

  const getBalances = (monthsData: any[], accountId: string, type: 'assets' | 'liabilities' | 'equity') => {
    return monthsData.map((m: any) => {
      const acc = m[type].find((a: any) => a.accountId === accountId);
      return Number(acc?.balance || 0);
    });
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Balance Sheet</h1>
            <p className="text-gray-500 text-sm">Statement of Financial Position (Monthly)</p>
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

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <Table className="min-w-[1200px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px] sticky left-0 bg-gray-50 z-10 border-r shadow-[1px_0_0_rgba(0,0,0,0.1)]">Account</TableHead>
              {MONTHS.map(m => (
                <TableHead key={m} className="text-right whitespace-nowrap">{m} {year}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* ASSETS */}
            <TableRow className="bg-gray-100 hover:bg-gray-100"><TableCell colSpan={13} className="font-bold sticky left-0">ASSETS</TableCell></TableRow>
            {Array.from(assetMap.entries()).map(([id, name]) => (
              <TableRow key={id}>
                <TableCell className="sticky left-0 bg-white border-r shadow-[1px_0_0_rgba(0,0,0,0.1)]">{name}</TableCell>
                {getBalances(months, id, 'assets').map((bal, i) => (
                  <TableCell key={i} className="text-right">₹{bal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                ))}
              </TableRow>
            ))}
            <TableRow className="bg-blue-50 font-semibold">
              <TableCell className="sticky left-0 bg-blue-50 border-r shadow-[1px_0_0_rgba(0,0,0,0.1)]">Total Assets</TableCell>
              {months.map((m: any, i: number) => (
                <TableCell key={i} className="text-right text-blue-700">₹{Number(m.totalAssets || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
              ))}
            </TableRow>

            {/* LIABILITIES */}
            <TableRow className="bg-gray-100 hover:bg-gray-100"><TableCell colSpan={13} className="font-bold sticky left-0">LIABILITIES</TableCell></TableRow>
            {Array.from(liabilityMap.entries()).map(([id, name]) => (
              <TableRow key={id}>
                <TableCell className="sticky left-0 bg-white border-r shadow-[1px_0_0_rgba(0,0,0,0.1)]">{name}</TableCell>
                {getBalances(months, id, 'liabilities').map((bal, i) => (
                  <TableCell key={i} className="text-right">₹{bal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                ))}
              </TableRow>
            ))}
            <TableRow className="bg-gray-50 font-semibold">
              <TableCell className="sticky left-0 bg-gray-50 border-r shadow-[1px_0_0_rgba(0,0,0,0.1)]">Total Liabilities</TableCell>
              {months.map((m: any, i: number) => (
                <TableCell key={i} className="text-right">₹{Number(m.totalLiabilities || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
              ))}
            </TableRow>

            {/* EQUITY */}
            <TableRow className="bg-gray-100 hover:bg-gray-100"><TableCell colSpan={13} className="font-bold sticky left-0">EQUITY</TableCell></TableRow>
            {Array.from(equityMap.entries()).map(([id, name]) => (
              <TableRow key={id}>
                <TableCell className="sticky left-0 bg-white border-r shadow-[1px_0_0_rgba(0,0,0,0.1)]">{name}</TableCell>
                {getBalances(months, id, 'equity').map((bal, i) => (
                  <TableCell key={i} className="text-right">₹{bal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                ))}
              </TableRow>
            ))}
            <TableRow>
              <TableCell className="sticky left-0 bg-white border-r shadow-[1px_0_0_rgba(0,0,0,0.1)]">Retained Earnings</TableCell>
              {months.map((m: any, i: number) => (
                <TableCell key={i} className="text-right">₹{Number(m.retainedEarnings || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
              ))}
            </TableRow>
            <TableRow className="bg-gray-50 font-semibold">
              <TableCell className="sticky left-0 bg-gray-50 border-r shadow-[1px_0_0_rgba(0,0,0,0.1)]">Total Equity</TableCell>
              {months.map((m: any, i: number) => (
                <TableCell key={i} className="text-right">₹{Number(m.totalEquity || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
              ))}
            </TableRow>

            {/* TOTAL LIABILITIES & EQUITY */}
            <TableRow className="bg-blue-50 font-bold border-t-2 border-gray-800">
              <TableCell className="sticky left-0 bg-blue-50 border-r shadow-[1px_0_0_rgba(0,0,0,0.1)]">Total Liabilities & Equity</TableCell>
              {months.map((m: any, i: number) => {
                const ta = Number(m.totalAssets || 0);
                const tle = Number(m.totalLiabilitiesAndEquity || 0);
                const isBalanced = Math.abs(ta - tle) < 0.01;
                return (
                  <TableCell key={i} className={`text-right ${isBalanced ? 'text-blue-700' : 'text-red-600'}`}>
                    ₹{tle.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
