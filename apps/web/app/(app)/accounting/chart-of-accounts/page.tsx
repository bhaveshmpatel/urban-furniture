"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAccounts = () => {
    setLoading(true);
    fetch("/api/accounts").then(r => r.json()).then(data => { setAccounts(data || []); setLoading(false); });
  };

  useEffect(() => { fetchAccounts(); }, []);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const fd = new FormData(e.currentTarget);
    await fetch("/api/accounts", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: fd.get('name'), type: fd.get('type'), code: fd.get('code') || undefined })
    });
    setIsSubmitting(false); setIsOpen(false); fetchAccounts();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chart of Accounts</h1>
          <p className="text-uf-muted">Manage your financial accounts and groupings.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild><Button className="bg-uf-green hover:bg-uf-green/90 text-white"><Plus className="mr-2 h-4 w-4" /> Add Account</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create New Account</DialogTitle></DialogHeader>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2"><Label htmlFor="name">Account Name</Label><Input id="name" name="name" required /></div>
              <div className="space-y-2"><Label htmlFor="code">Account Code (Optional)</Label><Input id="code" name="code" /></div>
              <div className="space-y-2">
                <Label htmlFor="type">Account Type</Label>
                <Select name="type" defaultValue="ASSET">
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ASSET">Asset</SelectItem><SelectItem value="LIABILITY">Liability</SelectItem>
                    <SelectItem value="EQUITY">Equity</SelectItem><SelectItem value="INCOME">Income</SelectItem>
                    <SelectItem value="EXPENSE">Expense</SelectItem><SelectItem value="OTHER_EXPENSE">Other Expense</SelectItem>
                    <SelectItem value="BANK">Bank</SelectItem><SelectItem value="CASH">Cash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full bg-uf-green text-white" disabled={isSubmitting}>Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="rounded-md border border-uf-border bg-uf-surface">
        <Table>
          <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>Type</TableHead></TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={3} className="text-center py-8">Loading...</TableCell></TableRow> : 
             accounts.length === 0 ? <TableRow><TableCell colSpan={3} className="text-center py-8">No accounts found</TableCell></TableRow> :
             accounts.map(a => (
              <TableRow key={a.id} className="ledger-row hover:bg-uf-bg">
                <TableCell className="font-mono">{a.code || '-'}</TableCell>
                <TableCell className="font-medium">{a.name}</TableCell>
                <TableCell><Badge variant="outline">{a.type}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
