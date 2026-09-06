"use client";
import { useEffect, useState } from "react";
import { MasterDataLayout, ViewType } from "@/components/layout/MasterDataLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Printer } from "lucide-react";
import { PrintDocument, PrintHeader, PrintMeta, PrintLinesTable, PrintFooter } from "@/components/print/PrintDocument";
import { cn } from "@/lib/utils";

export default function PurchaseOrdersPage() {
  const [view, setView] = useState<ViewType>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortOrder, setSortOrder] = useState("NEWEST");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const [vendors, setVendors] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [activeBudgets, setActiveBudgets] = useState<any[]>([]);

  useEffect(() => {
    const delay = setTimeout(() => fetchData(), 300);
    return () => clearTimeout(delay);
  }, [page, searchQuery, statusFilter, sortOrder]);

  useEffect(() => {
    fetchDependencies();
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("id");
    if (id && orders.length > 0) {
      const order = orders.find(o => o.id === id);
      if (order) {
        handleRowClick(order);
        window.history.replaceState({}, '', '/purchase/orders');
      }
    }
  }, [orders]);

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
    const res = await fetch(`/api/purchase-orders?${params.toString()}`);
    const json = await res.json();
    setOrders(json.data || []);
    setTotalPages(json.metadata?.totalPages || 1);
    setLoading(false);
  };

  const fetchDependencies = async () => {
    const resV = await fetch("/api/contacts?limit=1000");
    setVendors((await resV.json()).filter((v: any) => v.type === "VENDOR" || v.type === "BOTH"));
    const resP = await fetch("/api/products?limit=1000");
    setProducts(await resP.json());
    const resB = await fetch("/api/reports/budget?status=CONFIRMED");
    const jsonB = await resB.json();
    setActiveBudgets(jsonB.budgets || jsonB || []);
  };

  const handleRowClick = async (o: any) => {
    const res = await fetch(`/api/purchase-orders/${o.id}`);
    setSelectedOrder(await res.json());
    setView("form");
  };

  const handleNew = () => {
    setSelectedOrder(null);
    setView("form");
  };

  const handleBack = () => {
    setView("list");
    fetchData();
  };

  const filteredOrders = orders;

  const renderList = () => (
    <div>

    <div className="flex items-center justify-between mb-6 bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-white/60 shadow-sm ring-1 ring-black/5">
      <div className="flex space-x-4 items-center">
        <div className="text-sm font-semibold text-slate-600">Filter by Status:</div>
        <select className="border-slate-200/60 bg-white/80 rounded-xl px-3 py-1.5 text-sm focus:ring-uf-green/30" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="ALL">All</option>
          <option value="DRAFT">Draft</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>
      <div className="flex space-x-4 items-center">
        <div className="text-sm font-semibold text-slate-600">Sort by Date:</div>
        <select className="border-slate-200/60 bg-white/80 rounded-xl px-3 py-1.5 text-sm focus:ring-uf-green/30" value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
          <option value="NEWEST">Newest First</option>
          <option value="OLDEST">Oldest First</option>
        </select>
      </div>
    </div>
  
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>PO Number</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={4} className="text-center py-16 text-slate-500">Loading purchase orders...</TableCell></TableRow>
          ) : filteredOrders.length === 0 ? (
            <TableRow><TableCell colSpan={4} className="text-center py-16 text-slate-500">No purchase orders found</TableCell></TableRow>
          ) : (
            filteredOrders.map(o => (
              <TableRow key={o.id} className="cursor-pointer" onClick={() => handleRowClick(o)}>
                <TableCell className="font-semibold text-uf-green">PO-{o.orderNumber?.toString().padStart(5, '0')}</TableCell>
                <TableCell>{o.vendor?.name}</TableCell>
                <TableCell className="text-slate-500">
                  <div className="flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mr-2"></span>
                    {new Date(o.orderDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("px-2.5 py-0.5 font-medium text-xs border", o.status === "CONFIRMED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : o.status === "CANCELLED" ? "bg-red-50 text-red-700 border-red-200" : "bg-slate-50 text-slate-700 border-slate-200")}>
                    {o.status}
                  </Badge>
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
      <div className="flex items-center justify-between mb-6 bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-white/60 shadow-sm ring-1 ring-black/5">
        <div className="flex space-x-4 items-center">
          <div className="text-sm font-semibold text-slate-600">Filter by Status:</div>
          <select className="border-slate-200/60 bg-white/80 rounded-xl px-3 py-1.5 text-sm focus:ring-uf-green/30" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="ALL">All</option>
            <option value="DRAFT">Draft</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        <div className="flex space-x-4 items-center">
          <div className="text-sm font-semibold text-slate-600">Sort by Date:</div>
          <select className="border-slate-200/60 bg-white/80 rounded-xl px-3 py-1.5 text-sm focus:ring-uf-green/30" value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
            <option value="NEWEST">Newest First</option>
            <option value="OLDEST">Oldest First</option>
          </select>
        </div>
      </div>
  
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredOrders.map(o => (
          <div key={o.id} onClick={() => handleRowClick(o)} className="group bg-white/80 backdrop-blur-sm border border-white ring-1 ring-slate-200/50 rounded-2xl p-5 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 cursor-pointer">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-slate-800 text-lg">PO-{o.orderNumber?.toString().padStart(5, '0')}</h3>
              <Badge variant="outline" className={cn("px-2.5 py-0.5 font-medium text-xs border", o.status === "CONFIRMED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : o.status === "CANCELLED" ? "bg-red-50 text-red-700 border-red-200" : "bg-slate-50 text-slate-700 border-slate-200")}>
                {o.status}
              </Badge>
            </div>
            <div className="space-y-1 mt-auto pt-2 border-t border-slate-100">
              <div className="text-sm font-semibold text-slate-700 line-clamp-1">{o.vendor?.name}</div>
              <div className="text-xs font-medium text-slate-400 flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mr-2"></span>
                {new Date(o.orderDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderForm = () => <PurchaseOrderForm order={selectedOrder} vendors={vendors} products={products} activeBudgets={activeBudgets} onSave={handleBack} />;

  return (
    <MasterDataLayout
      title="Purchase Orders"
      subtitle="Manage purchase orders and convert them to vendor bills."
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

function PurchaseOrderForm({ order, vendors, products, activeBudgets, onSave }: any) {
  const [formData, setFormData] = useState<any>(order || {
    vendorId: "", orderDate: new Date().toISOString().split('T')[0], lines: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const isNew = !order;
  const status = order?.status || "DRAFT";

  const handleChange = (k: string, v: any) => setFormData((prev: any) => ({ ...prev, [k]: v }));

  const handleLineChange = (index: number, k: string, v: any) => {
    const newLines = [...formData.lines];
    newLines[index][k] = v;
    
    // Auto-fill price from product
    if (k === 'productId') {
      const p = products.find((x: any) => x.id === v);
      if (p) newLines[index].unitPrice = p.costPrice;
    }
    
    setFormData({ ...formData, lines: newLines });
  };

  const addLine = () => {
    setFormData({
      ...formData,
      lines: [...formData.lines, { productId: "", analyticAccountId: "", quantity: 1, unitPrice: 0 }]
    });
  };

  const removeLine = (index: number) => {
    setFormData({
      ...formData,
      lines: formData.lines.filter((_: any, i: number) => i !== index)
    });
  };

  const total = formData.lines.reduce((acc: number, l: any) => acc + (Number(l.quantity) * Number(l.unitPrice)), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let res;
      if (isNew) {
        res = await fetch("/api/purchase-orders", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        });
      } else {
        res = await fetch(`/api/purchase-orders/${order.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        });
      }

      if (!res.ok) {
        const data = await res.json();
        alert(`Failed to save Purchase Order:\n\n${data.error || "Unknown error occurred"}`);
        return;
      }
      
      onSave();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAction = async (action: string) => {
    if (!order) return;
    setIsSubmitting(true);
    await fetch(`/api/purchase-orders/${order.id}/${action}`, { method: "POST" });
    setIsSubmitting(false);
    onSave();
  };

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-sm border border-white/80 ring-1 ring-slate-200/50 p-6 md:p-8 mb-8">
      <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-200/60">
        <div>
          <h2 className="text-xl font-bold">{isNew ? "New Purchase Order" : `PO-${order.orderNumber?.toString().padStart(5, "0")}`}</h2>
          {!isNew && order.bill && (
            <div className="text-sm mt-1 font-medium">
              Linked Bill: <a href={`/purchase/bills?id=${order.bill.id}`} className="text-blue-600 hover:underline">BILL-{order.bill.id.slice(-8).toUpperCase()}</a> ({order.bill.status})
            </div>
          )}
        </div>
        <div className="space-x-2">
          {status === "DRAFT" && !isNew && <Button variant="outline" onClick={() => handleAction("confirm")}>Confirm PO</Button>}
          {status === "CONFIRMED" && !order.bill && <Button variant="outline" onClick={() => handleAction("create-bill")}>Create Bill</Button>}
          {!isNew && (
            <Button variant="outline" size="sm" onClick={() => setShowPrint(true)}>
              <Printer className="h-4 w-4 mr-1" /> Print
            </Button>
          )}
          <Badge variant="outline" className="ml-4 text-sm px-3 py-1 bg-gray-50">{status}</Badge>
        </div>
      </div>


      {/* ── Print overlay ── */}
      {showPrint && order && (() => {
        const party = vendors.find((c: any) => c.id === order.vendorId);
        const linesTotal = (order.lines || []).reduce((s: number, l: any) => s + Number(l.quantity) * Number(l.unitPrice), 0);
        const tax = Number(order.taxAmount || 0);
        return (
          <PrintDocument onClose={() => setShowPrint(false)}>
            <div className="p-12 max-w-[210mm] mx-auto">
              <PrintHeader
                title="Purchase Order"
                docNumber={`PO/${order.id.slice(-8).toUpperCase()}`}
                status={status}
              />
              <PrintMeta rows={[
                { label: "Party", value: party?.name || order.vendorId },
                { label: "Date", value: order.invoiceDate ? new Date(order.invoiceDate).toLocaleDateString("en-IN") : order.orderDate ? new Date(order.orderDate).toLocaleDateString("en-IN") : "—" },
                { label: "Due Date", value: order.dueDate ? new Date(order.dueDate).toLocaleDateString("en-IN") : "—" },
                { label: "Status", value: status },
              ]} />
              <PrintLinesTable
                lines={(order.lines || []).map((l: any) => {
                  const p = products.find((x: any) => x.id === l.productId);
                  return { description: p?.name || l.productId, qty: Number(l.quantity), price: Number(l.unitPrice), subtotal: Number(l.quantity) * Number(l.unitPrice) };
                })}
                subtotal={linesTotal}
                tax={tax}
                total={linesTotal + tax}
              />
              <PrintFooter note="Please confirm receipt of goods upon delivery." />
            </div>
          </PrintDocument>
        );
      })()}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Vendor</Label>
            <Select value={formData.vendorId} onValueChange={v => handleChange("vendorId", v)} disabled={!isNew && status !== "DRAFT"}>
              <SelectTrigger><SelectValue placeholder="Select Vendor" /></SelectTrigger>
              <SelectContent>
                {vendors.map((v: any) => (
                  <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Order Date</Label>
            <Input type="date" required value={formData.orderDate ? new Date(formData.orderDate).toISOString().split('T')[0] : ""} onChange={e => handleChange("orderDate", e.target.value)} disabled={!isNew && status !== "DRAFT"} />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">Order Lines</h3>
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
                  <TableHead>Product</TableHead>
                  <TableHead>Budget / Cost Center</TableHead>
                  <TableHead className="w-24">Quantity</TableHead>
                  <TableHead className="w-32">Unit Price</TableHead>
                  <TableHead className="w-32 text-right">Subtotal</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formData.lines.map((line: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Select value={line.productId} onValueChange={v => handleLineChange(idx, "productId", v)} disabled={!isNew && status !== "DRAFT"}>
                        <SelectTrigger><SelectValue placeholder="Select Product" /></SelectTrigger>
                        <SelectContent>
                          {products.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select required value={line.analyticAccountId || ""} onValueChange={v => handleLineChange(idx, "analyticAccountId", v)} disabled={!isNew && status !== "DRAFT"}>
                        <SelectTrigger><SelectValue placeholder="Select Cost Center" /></SelectTrigger>
                        <SelectContent>
                          {Object.values(
                            activeBudgets.reduce((acc: any, b: any) => {
                              if (!acc[b.analyticAccountId]) {
                                acc[b.analyticAccountId] = {
                                  id: b.analyticAccountId,
                                  name: b.analyticAccount?.name ? `${b.analyticAccount.name} [${b.name}]` : b.name,
                                  balance: Number(b.balance) || 0
                                };
                              } else {
                                acc[b.analyticAccountId].balance += (Number(b.balance) || 0);
                              }
                              return acc;
                            }, {})
                          ).map((b: any) => (
                            <SelectItem key={b.id} value={b.id}>
                              {b.name} (₹{Number(b.balance).toLocaleString()} rem.)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input type="number" min="1" value={line.quantity} onChange={e => handleLineChange(idx, "quantity", e.target.value)} disabled={!isNew && status !== "DRAFT"} />
                    </TableCell>
                    <TableCell>
                      <Input type="number" value={line.unitPrice} onChange={e => handleLineChange(idx, "unitPrice", e.target.value)} disabled={!isNew && status !== "DRAFT"} />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {(Number(line.quantity) * Number(line.unitPrice)).toLocaleString()}
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
                {formData.lines.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center py-4 text-gray-500">No lines added</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-end mt-4">
            <div className="text-lg">
              <span className="font-medium mr-4">Total:</span>
              <span className="font-bold">₹{total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {(isNew || status === "DRAFT") && (
          <div className="pt-4 flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              Save Purchase Order
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
