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

export default function JournalsPage() {
  const [journals, setJournals] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [jRes, aRes] = await Promise.all([fetch("/api/journals"), fetch("/api/accounts")]);
    setJournals(await jRes.json()); setAccounts(await aRes.json());
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const fd = new FormData(e.currentTarget);
    await fetch("/api/journals", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: fd.get('name'), type: fd.get('type'), defaultDebitAccountId: fd.get('defaultAccountId') })
    });
    setIsSubmitting(false); setIsOpen(false); fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Journals</h1>
          <p className="text-uf-muted">Manage your accounting journals.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild><Button className="bg-uf-green hover:bg-uf-green/90 text-white"><Plus className="mr-2 h-4 w-4" /> Add Journal</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create New Journal</DialogTitle></DialogHeader>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2"><Label htmlFor="name">Journal Name</Label><Input id="name" name="name" required /></div>
              <div className="space-y-2">
                <Label htmlFor="type">Journal Type</Label>
                <Select name="type" defaultValue="GENERAL">
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SALES">Sales</SelectItem><SelectItem value="PURCHASE">Purchase</SelectItem>
                    <SelectItem value="BANK">Bank</SelectItem><SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="GENERAL">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultAccountId">Default Account</Label>
                <Select name="defaultAccountId" required>
                  <SelectTrigger><SelectValue placeholder="Select an account" /></SelectTrigger>
                  <SelectContent>
                    {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name} ({a.type})</SelectItem>)}
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
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Default Account ID</TableHead></TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={3} className="text-center py-8">Loading...</TableCell></TableRow> : 
             journals.length === 0 ? <TableRow><TableCell colSpan={3} className="text-center py-8">No journals found</TableCell></TableRow> :
             journals.map(j => (
              <TableRow key={j.id} className="ledger-row hover:bg-uf-bg">
                <TableCell className="font-medium">{j.name}</TableCell>
                <TableCell><Badge variant="outline">{j.type}</Badge></TableCell>
                <TableCell className="font-mono text-xs">{j.defaultAccountId}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
