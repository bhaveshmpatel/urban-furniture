"use client";
import { useEffect, useState } from "react";
import { MasterDataLayout, ViewType } from "@/components/layout/MasterDataLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PieChart, Pie, Cell, Tooltip } from "recharts";

export default function BudgetsPage() {
  const [view, setView] = useState<ViewType>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortOrder, setSortOrder] = useState("NEWEST");
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBudget, setSelectedBudget] = useState<any>(null);

  // Form selections
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);

  useEffect(() => {
    fetchFormDependencies();
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
    const res = await fetch(`/api/budgets?${params.toString()}`);
    const json = await res.json();
    setBudgets(json.data || []);
    setTotalPages(json.metadata?.totalPages || 1);
    setLoading(false);
  };

  const fetchFormDependencies = async () => {
    const resA = await fetch("/api/analytic-accounts?limit=1000");
    const dataA = await resA.json();
    setAnalytics(dataA || []);
    const resC = await fetch("/api/contacts?limit=1000");
    const dataC = await resC.json();
    setContacts(dataC || []);
  };

  const handleRowClick = (b: any) => {
    setSelectedBudget(b);
    setView("form");
  };

  const handleNew = () => {
    setSelectedBudget(null);
    setView("form");
  };

  const handleBack = () => {
    setView("list");
    fetchData();
  };

  const filteredBudgets = budgets;

  const MiniPieChart = ({ achieved, balance }: { achieved: number, balance: number }) => {
    const data = [
      { name: "Achieved", value: achieved || 0 },
      { name: "Balance", value: balance > 0 ? balance : 0 }
    ];
    const COLORS = ["#10b981", "#e2e8f0"];
    if (!achieved && !balance) return <span className="text-xs text-gray-400">N/A</span>;
    return (
      <PieChart width={40} height={40}>
        <Pie data={data} dataKey="value" cx="50%" cy="50%" innerRadius={10} outerRadius={20} fill="#8884d8" paddingAngle={2}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    );
  };

  const renderList = () => (
    <div>
      <div className="flex items-center justify-between mb-4 bg-white p-3 rounded-md border shadow-sm">
        <div className="flex space-x-4 items-center">
          <div className="text-sm font-medium text-gray-500">Filter by Status:</div>
          <select className="border rounded px-2 py-1 text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="ALL">All</option>
            <option value="DRAFT">Draft</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="REVISED">Revised</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        <div className="flex space-x-4 items-center">
          <div className="text-sm font-medium text-gray-500">Sort by Date:</div>
          <select className="border rounded px-2 py-1 text-sm" value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
            <option value="NEWEST">Newest First</option>
            <option value="OLDEST">Oldest First</option>
          </select>
        </div>
      </div>
      <div className="rounded-md border border-uf-border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Budget Name</TableHead>
              <TableHead>Period Start</TableHead>
              <TableHead>Period End</TableHead>
              <TableHead className="text-right">Committed (₹)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
            ) : filteredBudgets.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8">No budgets found</TableCell></TableRow>
            ) : (
              filteredBudgets.map(b => (
                <TableRow key={b.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleRowClick(b)}>
                  <TableCell className="font-medium text-uf-green">{b.name}</TableCell>
                  <TableCell>{new Date(b.periodStart).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(b.periodEnd).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right font-medium text-gray-900">
                    ₹{Number(b.committedAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell><Badge variant="outline">{b.status}</Badge></TableCell>
                  <TableCell>
                    {(b.status === "CONFIRMED" || b.status === "REVISED") ? (
                      <MiniPieChart achieved={b.achievedAmount} balance={b.balance} />
                    ) : "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  const renderKanban = () => (
    <div>
      <div className="flex items-center justify-between mb-4 bg-white p-3 rounded-md border shadow-sm">
        <div className="flex space-x-4 items-center">
          <div className="text-sm font-medium text-gray-500">Filter by Status:</div>
          <select className="border rounded px-2 py-1 text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="ALL">All</option>
            <option value="DRAFT">Draft</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="REVISED">Revised</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        <div className="flex space-x-4 items-center">
          <div className="text-sm font-medium text-gray-500">Sort by Date:</div>
          <select className="border rounded px-2 py-1 text-sm" value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
            <option value="NEWEST">Newest First</option>
            <option value="OLDEST">Oldest First</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredBudgets.map(b => (
          <div key={b.id} onClick={() => handleRowClick(b)} className="bg-white border rounded-lg p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-uf-green">{b.name}</h3>
              <Badge variant="outline">{b.status}</Badge>
            </div>
            <div className="text-sm text-gray-500 mb-4">
              {new Date(b.periodStart).toLocaleDateString()} - {new Date(b.periodEnd).toLocaleDateString()}
            </div>
            {(b.status === "CONFIRMED" || b.status === "REVISED") && (
              <div className="flex justify-between items-center text-sm border-t pt-2">
                <span className="text-gray-600">Committed: {Number(b.committedAmount).toLocaleString()}</span>
                <MiniPieChart achieved={b.achievedAmount} balance={b.balance} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderForm = () => <BudgetForm budget={selectedBudget} onSave={handleBack} analytics={analytics} contacts={contacts} />;

  return (
    <MasterDataLayout
      title="Budgets"
      subtitle="Manage your financial budgets and track actuals."
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

function BudgetForm({ budget, onSave, analytics, contacts }: any) {
  const [formData, setFormData] = useState<any>(budget || {
    name: "", periodStart: "", periodEnd: "", committedAmount: "", analyticAccountId: "", responsibleContactId: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [achievedDetails, setAchievedDetails] = useState<any[] | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const isNew = !budget;
  const status = budget?.status || "DRAFT";

  useEffect(() => {
    if (budget && (status === "CONFIRMED" || status === "REVISED")) {
      setLoadingDetails(true);
      fetch(`/api/budgets/${budget.id}/achieved-detail`)
        .then(res => res.json())
        .then(data => {
          setAchievedDetails(data);
          setLoadingDetails(false);
        })
        .catch(err => {
          console.error(err);
          setLoadingDetails(false);
        });
    }
  }, [budget, status]);

  const handleChange = (k: string, v: any) => setFormData((prev: any) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (isNew) {
        await fetch("/api/budgets", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formData, committedAmount: Number(formData.committedAmount), periodStart: new Date(formData.periodStart), periodEnd: new Date(formData.periodEnd) })
        });
      } else {
        await fetch(`/api/budgets/${budget.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formData, committedAmount: Number(formData.committedAmount), periodStart: new Date(formData.periodStart), periodEnd: new Date(formData.periodEnd) })
        });
      }
      onSave();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAction = async (action: string, body?: any) => {
    if (!budget) return;
    setIsSubmitting(true);
    await fetch(`/api/budgets/${budget.id}/${action}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined
    });
    setIsSubmitting(false);
    onSave();
  };

  const selectedAnalytic = analytics.find((a: any) => a.id === formData.analyticAccountId);

  return (
    <div className="bg-white rounded-md shadow-sm border p-6">
      <div className="flex justify-between items-center mb-6 pb-4 border-b">
        <h2 className="text-xl font-bold">{isNew ? "New Budget" : formData.name}</h2>
        <div className="space-x-2">
          {status === "DRAFT" && !isNew && <Button variant="outline" onClick={() => handleAction("confirm")}>Confirm Budget</Button>}
          {status === "DRAFT" && !isNew && <Button variant="destructive" onClick={() => handleAction("cancel")}>Cancel</Button>}
          {status === "CONFIRMED" && (
            <Button variant="outline" onClick={() => {
              const newAmt = prompt("Enter revised committed amount:", formData.committedAmount);
              if (newAmt) handleAction("revise", { committedAmount: Number(newAmt) });
            }}>Revise Budget</Button>
          )}
          {status === "CONFIRMED" && <Button variant="destructive" onClick={() => handleAction("cancel")}>Cancel</Button>}
          <Badge variant="outline" className="ml-4 text-sm px-3 py-1 bg-gray-50">{status}</Badge>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Budget Name</Label>
            <Input required value={formData.name} onChange={e => handleChange("name", e.target.value)} disabled={!isNew && status !== "DRAFT"} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Period Start</Label>
              <Input type="date" required value={formData.periodStart ? new Date(formData.periodStart).toISOString().split('T')[0] : ""} onChange={e => handleChange("periodStart", e.target.value)} disabled={!isNew && status !== "DRAFT"} />
            </div>
            <div className="space-y-2">
              <Label>Period End</Label>
              <Input type="date" required value={formData.periodEnd ? new Date(formData.periodEnd).toISOString().split('T')[0] : ""} onChange={e => handleChange("periodEnd", e.target.value)} disabled={!isNew && status !== "DRAFT"} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Analytic Account</Label>
            <Select value={formData.analyticAccountId} onValueChange={v => handleChange("analyticAccountId", v)} disabled={!isNew && status !== "DRAFT"}>
              <SelectTrigger><SelectValue placeholder="Select Analytic Account" /></SelectTrigger>
              <SelectContent>
                {analytics.map((a: any) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <Input value={selectedAnalytic?.type || ""} disabled className="bg-gray-50" />
          </div>

          <div className="space-y-2">
            <Label>Committed Amount</Label>
            <Input type="number" required value={formData.committedAmount} onChange={e => handleChange("committedAmount", e.target.value)} disabled={!isNew && status !== "DRAFT"} />
          </div>

          <div className="space-y-2">
            <Label>Responsible Person</Label>
            <Select value={formData.responsibleContactId} onValueChange={v => handleChange("responsibleContactId", v)} disabled={!isNew && status !== "DRAFT"}>
              <SelectTrigger><SelectValue placeholder="Select Contact" /></SelectTrigger>
              <SelectContent>
                {contacts.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {budget && (status === "CONFIRMED" || status === "REVISED") && (
          <div className="mt-8 p-6 bg-blue-50/50 rounded-xl border border-blue-100">
            <h3 className="font-bold text-lg mb-4 text-blue-900">Budget Progress Summary</h3>
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="text-sm text-gray-500 font-medium">Achieved Amount</div>
                <div className="text-2xl font-bold text-emerald-600 mt-1">
                  ₹{Number(budget.achievedAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="text-sm text-gray-500 font-medium">Achieved %</div>
                <div className="text-2xl font-bold text-blue-600 mt-1">
                  {budget.committedAmount > 0 ? ((budget.achievedAmount / budget.committedAmount) * 100).toFixed(1) : 0}%
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="text-sm text-gray-500 font-medium">Remaining Balance</div>
                <div className="text-2xl font-bold text-orange-500 mt-1">
                  ₹{Number(budget.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            <h3 className="font-bold text-lg mb-4 text-gray-900">Purchase / Income Details</h3>
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Date</TableHead>
                    <TableHead>Product / Description</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right font-bold">Total</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingDetails ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">Loading details...</TableCell></TableRow>
                  ) : achievedDetails && achievedDetails.length > 0 ? (
                    achievedDetails.map((d: any) => {
                      const date = (d.bill || d.invoice)?.invoiceDate;
                      const status = (d.bill || d.invoice)?.status;
                      const total = Number(d.quantity) * Number(d.unitPrice);
                      return (
                        <TableRow key={d.id}>
                          <TableCell>{date ? new Date(date).toLocaleDateString() : 'N/A'}</TableCell>
                          <TableCell className="font-medium">{d.product?.name || 'Unknown'}</TableCell>
                          <TableCell className="text-right">{Number(d.quantity)}</TableCell>
                          <TableCell className="text-right">₹{Number(d.unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell className="text-right font-bold text-gray-900">₹{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline" className="bg-gray-50">{status}</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">No records found for this budget period.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {(isNew || status === "DRAFT") && (
          <div className="pt-4 flex justify-end">
            <Button type="submit" disabled={isSubmitting} >
              Save Budget
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
