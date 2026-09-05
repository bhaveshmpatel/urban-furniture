"use client";
import { useEffect, useState } from "react";
import { MasterDataLayout, ViewType } from "@/components/layout/MasterDataLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AnalyticAccountsPage() {
  const [view, setView] = useState<ViewType>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const res = await fetch("/api/analytic-accounts");
    const data = await res.json();
    setAccounts(data || []);
    setLoading(false);
  };

  const handleRowClick = (c: any) => {
    setSelectedAccount(c);
    setView("form");
  };

  const handleNew = () => {
    setSelectedAccount(null);
    setView("form");
  };

  const handleBack = () => {
    setView("list");
    fetchData();
  };

  const filteredAccounts = accounts.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const renderList = () => (
    <div className="rounded-md border border-uf-border bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Account Name</TableHead>
            <TableHead>Type</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={2} className="text-center py-8">Loading...</TableCell></TableRow>
          ) : filteredAccounts.length === 0 ? (
            <TableRow><TableCell colSpan={2} className="text-center py-8">No analytic accounts found</TableCell></TableRow>
          ) : (
            filteredAccounts.map(a => (
              <TableRow key={a.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleRowClick(a)}>
                <TableCell className="font-medium text-uf-green">{a.name}</TableCell>
                <TableCell><Badge variant="outline">{a.type}</Badge></TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  const renderKanban = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {filteredAccounts.map(a => (
        <div key={a.id} onClick={() => handleRowClick(a)} className="bg-white border rounded-lg p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-uf-green">{a.name}</h3>
            <Badge variant="outline">{a.type}</Badge>
          </div>
        </div>
      ))}
    </div>
  );

  const renderForm = () => <AnalyticAccountForm account={selectedAccount} onSave={handleBack} />;

  return (
    <MasterDataLayout
      title="Analytic Accounts"
      subtitle="Track costs and revenues for specific projects or departments."
      view={view}
      setView={setView}
      onNew={handleNew}
      onBack={handleBack}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      renderList={renderList}
      renderKanban={renderKanban}
      renderForm={renderForm}
    />
  );
}

function AnalyticAccountForm({ account, onSave }: any) {
  const [formData, setFormData] = useState<any>(account || {
    name: "", type: "INCOME"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isNew = !account;

  const handleChange = (k: string, v: any) => setFormData((prev: any) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (isNew) {
        await fetch("/api/analytic-accounts", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        });
      } else {
        await fetch(`/api/analytic-accounts/${account.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        });
      }
      onSave();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-md shadow-sm border p-6 max-w-2xl">
      <div className="flex justify-between items-center mb-6 pb-4 border-b">
        <h2 className="text-xl font-bold">{isNew ? "New Analytic Account" : formData.name}</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label>Account Name</Label>
          <Input required value={formData.name || ""} onChange={e => handleChange("name", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={formData.type} onValueChange={v => handleChange("type", v)}>
            <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="INCOME">Income</SelectItem>
              <SelectItem value="EXPENSE">Expense</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="pt-4 flex justify-end">
          <Button type="submit" disabled={isSubmitting} >
            {isNew ? "Create Account" : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
