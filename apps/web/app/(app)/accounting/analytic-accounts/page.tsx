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

export default function AnalyticAccountsPage() {
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAnalytics = () => {
    setLoading(true);
    fetch("/api/analytic-accounts").then(r => r.json()).then(data => { setAnalytics(data || []); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchAnalytics(); }, []);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const fd = new FormData(e.currentTarget);
    await fetch("/api/analytic-accounts", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: fd.get('name'), type: fd.get('type') })
    });
    setIsSubmitting(false); setIsOpen(false); fetchAnalytics();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytic Accounts</h1>
          <p className="text-uf-muted">Manage cost centers and profit centers.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild><Button className="bg-uf-green hover:bg-uf-green/90 text-white"><Plus className="mr-2 h-4 w-4" /> Add Analytic</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Analytic Account</DialogTitle></DialogHeader>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2"><Label htmlFor="name">Name</Label><Input id="name" name="name" required /></div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select name="type" defaultValue="INCOME">
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INCOME">Income (Profit Center)</SelectItem>
                    <SelectItem value="EXPENSE">Expense (Cost Center)</SelectItem>
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
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Type</TableHead></TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={2} className="text-center py-8">Loading...</TableCell></TableRow> : 
             analytics.length === 0 ? <TableRow><TableCell colSpan={2} className="text-center py-8">No analytic accounts found</TableCell></TableRow> :
             analytics.map(a => (
              <TableRow key={a.id} className="ledger-row hover:bg-uf-bg">
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
