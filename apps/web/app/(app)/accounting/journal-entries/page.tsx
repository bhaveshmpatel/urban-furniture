"use client";
import { useEffect, useState } from "react";
import { MasterDataLayout, ViewType } from "@/components/layout/MasterDataLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

export default function JournalEntriesPage() {
  const [view, setView] = useState<ViewType>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortOrder, setSortOrder] = useState("NEWEST");
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);

  const [journals, setJournals] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any[]>([]);

  useEffect(() => {
    fetchDependencies();
    const delay = setTimeout(() => fetchData(), 300);
    return () => clearTimeout(delay);
  }, [page, searchQuery, statusFilter, sortOrder]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("id");
    if (id && entries.length > 0) {
      const entry = entries.find(e => e.id === id);
      if (entry) {
        handleRowClick(entry);
        window.history.replaceState({}, '', '/accounting/journal-entries');
      }
    }
  }, [entries]);

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
    const res = await fetch(`/api/journal-entries?${params.toString()}`);
    const json = await res.json();
    setEntries(json.data || []);
    setTotalPages(json.metadata?.totalPages || 1);
    setLoading(false);
  };

  const fetchDependencies = async () => {
    const resJ = await fetch("/api/journals?limit=1000");
    setJournals(await resJ.json());
    const resA = await fetch("/api/accounts?limit=1000");
    setAccounts(await resA.json());
    const resC = await fetch("/api/contacts?limit=1000");
    setContacts(await resC.json());
    const resAn = await fetch("/api/analytic-accounts?limit=1000");
    setAnalytics(await resAn.json());
  };

  const handleRowClick = async (e: any) => {
    const res = await fetch(`/api/journal-entries/${e.id}`);
    setSelectedEntry(await res.json());
    setView("form");
  };

  const handleNew = () => {
    setSelectedEntry(null);
    setView("form");
  };

  const handleBack = () => {
    setView("list");
    fetchData();
  };

  const filteredEntries = entries;

  const renderList = () => (
    <div className="rounded-md border border-uf-border bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead>Journal</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
          ) : filteredEntries.length === 0 ? (
            <TableRow><TableCell colSpan={6} className="text-center py-8">No journal entries found</TableCell></TableRow>
          ) : (
            filteredEntries.map(e => {
              const total = e.items?.reduce((acc: number, i: any) => acc + Number(i.debit), 0) || 0;
              return (
                <TableRow key={e.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleRowClick(e)}>
                  <TableCell>{new Date(e.date).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{e.reference || `JE-${e.id.slice(-8).toUpperCase()}`}</TableCell>
                  <TableCell>{e.journal?.name}</TableCell>
                  <TableCell>{e.sourceType ? e.sourceType.replace('_', ' ') : 'MANUAL'}</TableCell>
                  <TableCell>
                    <Badge variant={e.status === 'POSTED' ? 'default' : 'outline'}>{e.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">₹{total.toLocaleString()}</TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );

  const renderKanban = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {filteredEntries.map(e => {
        const total = e.items?.reduce((acc: number, i: any) => acc + Number(i.debit), 0) || 0;
        return (
          <div key={e.id} onClick={() => handleRowClick(e)} className="bg-white border rounded-lg p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold">{e.reference || `JE-${e.id.slice(-8).toUpperCase()}`}</h3>
              <Badge variant={e.status === 'POSTED' ? 'default' : 'outline'}>{e.status}</Badge>
            </div>
            <div className="text-sm text-gray-800 font-medium mb-1">{e.journal?.name}</div>
            <div className="text-xs text-gray-500 mb-2">{new Date(e.date).toLocaleDateString()}</div>
            <div className="flex justify-between items-center text-sm border-t pt-2 mt-2">
              <div className="text-xs text-gray-400">{e.sourceType ? e.sourceType.replace('_', ' ') : 'MANUAL'}</div>
              <div className="font-medium">₹{total.toLocaleString()}</div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderForm = () => (
    <JournalEntryForm 
      entry={selectedEntry} 
      journals={journals} 
      accounts={accounts} 
      contacts={contacts} 
      analytics={analytics} 
      onSave={handleBack} 
    />
  );

  return (
    <MasterDataLayout
      title="Journal Entries"
      subtitle="Manage your manual and system-generated accounting entries."
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

function JournalEntryForm({ entry, journals, accounts, contacts, analytics, onSave }: any) {
  const [formData, setFormData] = useState<any>(entry || {
    journalId: "", date: new Date().toISOString().split('T')[0], reference: "", items: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postError, setPostError] = useState("");

  // Auto-select first journal once the list loads (on new entry form)
  useEffect(() => {
    if (!entry && !formData.journalId && journals.length > 0) {
      setFormData((prev: any) => ({ ...prev, journalId: journals[0].id }));
    }
  }, [journals]);

  const isNew = !entry;
  const status = entry?.status || "DRAFT";

  const handleChange = (k: string, v: any) => setFormData((prev: any) => ({ ...prev, [k]: v }));

  const handleLineChange = (index: number, k: string, v: any) => {
    const newItems = [...formData.items];
    newItems[index][k] = v;
    setFormData({ ...formData, items: newItems });
  };

  const addLine = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { accountId: accounts[0]?.id || "", contactId: "", analyticAccountId: "", debit: 0, credit: 0 }]
    });
  };

  const removeLine = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_: any, i: number) => i !== index)
    });
  };

  const totalDebit = formData.items.reduce((acc: number, i: any) => acc + Number(i.debit || 0), 0);
  const totalCredit = formData.items.reduce((acc: number, i: any) => acc + Number(i.credit || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPostError("");
    setIsSubmitting(true);
    try {
      if (isNew) {
        const res = await fetch("/api/journal-entries", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        });
        if (!res.ok) {
          const err = await res.json();
          setPostError(err.error || "Failed to save journal entry.");
          return;
        }
      } else {
        const res = await fetch(`/api/journal-entries/${entry.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        });
        if (!res.ok) {
          const err = await res.json();
          setPostError(err.error || "Failed to save journal entry.");
          return;
        }
      }
      onSave();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAction = async (action: string) => {
    if (!entry) return;
    setPostError("");
    setIsSubmitting(true);
    
    // Front-end block for posting unbalanced entry
    if (action === "post" && !isBalanced) {
      setPostError("Debits must equal credits to post this entry.");
      setIsSubmitting(false);
      return;
    }

    const res = await fetch(`/api/journal-entries/${entry.id}/${action}`, { method: "POST" });
    if (!res.ok) {
      const err = await res.json();
      setPostError(err.error || "An error occurred.");
    } else {
      onSave();
    }
    setIsSubmitting(false);
  };

  return (
    <div className="bg-white rounded-md shadow-sm border p-6">
      <div className="flex justify-between items-center mb-6 pb-4 border-b">
        <div>
          <h2 className="text-xl font-bold">{isNew ? "New Journal Entry" : entry.reference || `JE-${entry.id.slice(-8).toUpperCase()}`}</h2>
          {!isNew && entry.sourceType && (
            <div className="text-sm mt-1 text-gray-500">
              Source: {entry.sourceType.replace('_', ' ')}
            </div>
          )}
        </div>
        <div className="space-x-2">
          {status === "DRAFT" && !isNew && (
            <Button variant="default" onClick={() => handleAction("post")} disabled={isSubmitting}>Post</Button>
          )}
          {status === "POSTED" && (
            <Button variant="outline" onClick={() => handleAction("reset-to-draft")} disabled={isSubmitting}>Reset to Draft</Button>
          )}
          {status === "DRAFT" && !isNew && (
            <Button variant="destructive" onClick={() => handleAction("cancel")} disabled={isSubmitting}>Cancel</Button>
          )}
          <Badge variant={status === "POSTED" ? "default" : "outline"} className="ml-4 text-sm px-3 py-1 bg-gray-50">{status}</Badge>
        </div>
      </div>

      {postError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-md">
          {postError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label>Accounting Date</Label>
            <Input type="date" required value={formData.date ? new Date(formData.date).toISOString().split('T')[0] : ""} onChange={e => handleChange("date", e.target.value)} disabled={!isNew && status !== "DRAFT"} />
          </div>
          <div className="space-y-2">
            <Label>Journal</Label>
            <Select value={formData.journalId} onValueChange={v => handleChange("journalId", v)} disabled={!isNew && status !== "DRAFT"}>
              <SelectTrigger><SelectValue placeholder="Select Journal" /></SelectTrigger>
              <SelectContent>
                {journals.map((j: any) => (
                  <SelectItem key={j.id} value={j.id}>{j.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Reference (Optional)</Label>
            <Input type="text" value={formData.reference || ""} onChange={e => handleChange("reference", e.target.value)} disabled={!isNew && status !== "DRAFT"} placeholder="e.g. ADJ-001" />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">Journal Items</h3>
            {(isNew || status === "DRAFT") && (
              <Button type="button" variant="outline" size="sm" onClick={addLine}>
                <Plus className="h-4 w-4 mr-2" /> Add Line
              </Button>
            )}
          </div>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-64">Account</TableHead>
                  <TableHead>Partner (Contact)</TableHead>
                  <TableHead>Analytic</TableHead>
                  <TableHead className="w-32 text-right">Debit</TableHead>
                  <TableHead className="w-32 text-right">Credit</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formData.items.map((item: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Select value={item.accountId} onValueChange={v => handleLineChange(idx, "accountId", v)} disabled={!isNew && status !== "DRAFT"}>
                        <SelectTrigger><SelectValue placeholder="Account" /></SelectTrigger>
                        <SelectContent>
                          {accounts.map((a: any) => <SelectItem key={a.id} value={a.id}>{a.code} - {a.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select value={item.contactId || "none"} onValueChange={v => handleLineChange(idx, "contactId", v === "none" ? null : v)} disabled={!isNew && status !== "DRAFT"}>
                        <SelectTrigger><SelectValue placeholder="Optional Partner" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {contacts.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select value={item.analyticAccountId || "none"} onValueChange={v => handleLineChange(idx, "analyticAccountId", v === "none" ? null : v)} disabled={!isNew && status !== "DRAFT"}>
                        <SelectTrigger><SelectValue placeholder="Optional Analytic" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {analytics.map((a: any) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input type="number" min="0" step="0.01" value={item.debit} onChange={e => handleLineChange(idx, "debit", e.target.value)} disabled={!isNew && status !== "DRAFT"} className="text-right" />
                    </TableCell>
                    <TableCell>
                      <Input type="number" min="0" step="0.01" value={item.credit} onChange={e => handleLineChange(idx, "credit", e.target.value)} disabled={!isNew && status !== "DRAFT"} className="text-right" />
                    </TableCell>
                    <TableCell>
                      {(isNew || status === "DRAFT") && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeLine(idx)} className="text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {formData.items.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center py-4 text-gray-500">No items added</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-end mt-4">
            <div className="w-72">
              <div className="flex justify-between items-center text-sm mb-2 text-gray-600">
                <span>Total Debit:</span>
                <span>₹{totalDebit.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm mb-2 text-gray-600">
                <span>Total Credit:</span>
                <span>₹{totalCredit.toLocaleString()}</span>
              </div>
              <div className={`flex justify-between items-center text-lg font-bold pt-2 border-t ${!isBalanced ? 'text-red-500' : 'text-uf-green'}`}>
                <span>Difference:</span>
                <span>₹{Math.abs(totalDebit - totalCredit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>

        {(isNew || status === "DRAFT") && (
          <div className="pt-4 flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              Save Draft Entry
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
