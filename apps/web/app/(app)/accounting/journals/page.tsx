"use client";
import { useEffect, useState } from "react";
import { MasterDataLayout, ViewType } from "@/components/layout/MasterDataLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function JournalsPage() {
  const [view, setView] = useState<ViewType>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortOrder, setSortOrder] = useState("NEWEST");
  const [journals, setJournals] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJournal, setSelectedJournal] = useState<any>(null);

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
      page: page.toString(),
      limit: "10",
      search: searchQuery,
      sort: sortOrder,
    });
    if (statusFilter !== "ALL") params.append("status", statusFilter);

    const [res, accRes] = await Promise.all([
      fetch(`/api/journals?${params.toString()}`),
      fetch("/api/accounts?limit=1000")
    ]);
    const json = await res.json();
    const accJson = await accRes.json();
    setJournals(json.data || json);
    setAccounts(accJson.data || accJson);
    setTotalPages(json.metadata?.totalPages || 1);
    setLoading(false);
  };

  const handleRowClick = (c: any) => {
    setSelectedJournal(c);
    setView("form");
  };

  const handleNew = () => {
    setSelectedJournal(null);
    setView("form");
  };

  const handleBack = () => {
    setView("list");
    fetchData();
  };

  const filteredJournals = journals;

  const renderList = () => (
    <div className="rounded-md border border-uf-border bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Journal Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Default Account</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={3} className="text-center py-8">Loading...</TableCell></TableRow>
          ) : filteredJournals.length === 0 ? (
            <TableRow><TableCell colSpan={3} className="text-center py-8">No journals found</TableCell></TableRow>
          ) : (
            filteredJournals.map(j => (
              <TableRow key={j.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleRowClick(j)}>
                <TableCell className="font-medium text-uf-green">{j.name}</TableCell>
                <TableCell><Badge variant="outline">{j.type}</Badge></TableCell>
                <TableCell>{j.defaultDebitAccount?.name || "-"}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  const renderKanban = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {filteredJournals.map(j => (
        <div key={j.id} onClick={() => handleRowClick(j)} className="bg-white border rounded-lg p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-uf-green">{j.name}</h3>
            <Badge variant="outline">{j.type}</Badge>
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Default A/c: {j.defaultDebitAccount?.name || "None"}
          </div>
        </div>
      ))}
    </div>
  );

  const renderForm = () => <JournalForm journal={selectedJournal} accounts={accounts} onSave={handleBack} />;

  return (
    <MasterDataLayout
      title="Journals"
      subtitle="Manage your accounting journals."
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

function JournalForm({ journal, accounts, onSave }: any) {
  const [formData, setFormData] = useState<any>(journal || {
    name: "", type: "SALES", defaultDebitAccountId: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isNew = !journal;

  const handleChange = (k: string, v: any) => setFormData((prev: any) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (isNew) {
        await fetch("/api/journals", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        });
      } else {
        await fetch(`/api/journals/${journal.id}`, {
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
        <h2 className="text-xl font-bold">{isNew ? "New Journal" : formData.name}</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label>Journal Name</Label>
          <Input required value={formData.name || ""} onChange={e => handleChange("name", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Journal Type</Label>
            <Select value={formData.type} onValueChange={v => handleChange("type", v)}>
              <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="SALES">Sales</SelectItem>
                <SelectItem value="PURCHASE">Purchase</SelectItem>
                <SelectItem value="BANK">Bank</SelectItem>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="GENERAL">General</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Default Account</Label>
            <Select value={formData.defaultDebitAccountId} onValueChange={v => handleChange("defaultDebitAccountId", v)}>
              <SelectTrigger><SelectValue placeholder="Select Account" /></SelectTrigger>
              <SelectContent>
                {accounts.map((a: any) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <Button type="submit" disabled={isSubmitting} >
            {isNew ? "Create Journal" : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
