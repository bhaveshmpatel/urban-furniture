"use client";
import { useEffect, useState } from "react";
import { MasterDataLayout, ViewType } from "@/components/layout/MasterDataLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ChartOfAccountsPage() {
  const [view, setView] = useState<ViewType>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortOrder, setSortOrder] = useState("NEWEST");
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);

  useEffect(() => {
    const delay = setTimeout(() => fetchData(), 300);
    return () => clearTimeout(delay);
  }, [page, searchQuery, statusFilter, sortOrder]);

    useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, sortOrder]);

  const fetchData = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      paginate: "true",
      page: page.toString(),
      limit: "10",
      search: searchQuery,
      sortOrder: sortOrder,
      statusFilter: statusFilter
    });
    const res = await fetch(`/api/accounts?${params.toString()}`);
    const json = await res.json();
    setAccounts(json.data || []);
    setTotalPages(json.metadata?.totalPages || 1);
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

  const filteredAccounts = accounts;

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
            <TableRow><TableCell colSpan={2} className="text-center py-8">No accounts found</TableCell></TableRow>
          ) : (
            filteredAccounts.map(a => (
              <TableRow key={a.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleRowClick(a)}>
                <TableCell className="font-medium text-uf-green">{a.name}</TableCell>
                <TableCell><Badge variant="outline">{a.type.replace('_', ' ')}</Badge></TableCell>
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
          </div>
          <Badge variant="outline">{a.type.replace('_', ' ')}</Badge>
        </div>
      ))}
    </div>
  );

  const renderForm = () => <AccountForm account={selectedAccount} onSave={handleBack} />;

  return (
    <MasterDataLayout
      title="Chart of Accounts"
      subtitle="Manage your accounting ledger accounts."
      view={view}
      setView={setView}
      onNew={handleNew}
      onBack={handleBack}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      renderList={renderList}
      renderKanban={renderKanban}
      renderForm={renderForm}
      pagination={{ page, totalPages, setPage }}
    />
  );
}

function AccountForm({ account, onSave }: any) {
  const [formData, setFormData] = useState<any>(account || {
    name: "", type: "ASSET"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isNew = !account;

  const handleChange = (k: string, v: any) => setFormData((prev: any) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (isNew) {
        await fetch("/api/accounts", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        });
      } else {
        await fetch(`/api/accounts/${account.id}`, {
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
        <h2 className="text-xl font-bold">{isNew ? "New Account" : formData.name}</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label>Account Name</Label>
          <Input required value={formData.name || ""} onChange={e => handleChange("name", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Account Type</Label>
          <Select value={formData.type} onValueChange={v => handleChange("type", v)}>
            <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Balance Sheet</SelectLabel>
                <SelectItem value="ASSET">Asset</SelectItem>
                <SelectItem value="LIABILITY">Liability</SelectItem>
                <SelectItem value="BANK">Bank</SelectItem>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="CAPITAL">Capital</SelectItem>
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Profit and Loss</SelectLabel>
                <SelectItem value="INCOME">Income</SelectItem>
                <SelectItem value="EXPENSE">Expenses</SelectItem>
                <SelectItem value="OTHER_EXPENSE">Other Expenses</SelectItem>
              </SelectGroup>
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
