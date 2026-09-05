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

export default function SalesOrdersPage() {
  const [view, setView] = useState<ViewType>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortOrder, setSortOrder] = useState("NEWEST");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any[]>([]);

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
        // Remove id from URL without reloading
        window.history.replaceState({}, '', '/sales/orders');
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
    const res = await fetch(`/api/sales-orders?${params.toString()}`);
    const json = await res.json();
    setOrders(json.data || []);
    setTotalPages(json.metadata?.totalPages || 1);
    setLoading(false);
  };

  const fetchDependencies = async () => {
    const resV = await fetch("/api/contacts");
    const contactsData = await resV.json();
    setCustomers(contactsData.filter((v: any) => v.type === "CUSTOMER" || v.type === "BOTH"));
    const resP = await fetch("/api/products");
    setProducts(await resP.json());
    const resA = await fetch("/api/analytic-accounts");
    setAnalytics((await resA.json()).filter((a: any) => a.type === "INCOME"));
  };

  const handleRowClick = async (o: any) => {
    const res = await fetch(`/api/sales-orders/${o.id}`);
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

    <div className="flex items-center justify-between mb-4 bg-white p-3 rounded-md border shadow-sm">
      <div className="flex space-x-4 items-center">
        <div className="text-sm font-medium text-gray-500">Filter by Status:</div>
        <select className="border rounded px-2 py-1 text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="ALL">All</option>
          <option value="DRAFT">Draft</option>
          <option value="CONFIRMED">Confirmed</option>
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
            <TableHead>SO Number</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={4} className="text-center py-8">Loading...</TableCell></TableRow>
          ) : filteredOrders.length === 0 ? (
            <TableRow><TableCell colSpan={4} className="text-center py-8">No sales orders found</TableCell></TableRow>
          ) : (
            filteredOrders.map(o => (
              <TableRow key={o.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleRowClick(o)}>
                <TableCell className="font-medium">SO-{o.id.slice(-8).toUpperCase()}</TableCell>
                <TableCell>{o.customer?.name}</TableCell>
                <TableCell>{new Date(o.orderDate).toLocaleDateString()}</TableCell>
                <TableCell><Badge variant="outline">{o.status}</Badge></TableCell>
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
      {filteredOrders.map(o => (
        <div key={o.id} onClick={() => handleRowClick(o)} className="bg-white border rounded-lg p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold">SO-{o.id.slice(-8).toUpperCase()}</h3>
            <Badge variant="outline">{o.status}</Badge>
          </div>
          <div className="text-sm text-gray-800 font-medium mb-1">{o.customer?.name}</div>
          <div className="text-xs text-gray-500">{new Date(o.orderDate).toLocaleDateString()}</div>
        </div>
      ))}
    </div>
    </div>
  );

  const renderForm = () => (
    <SalesOrderForm 
      order={selectedOrder} 
      customers={customers} 
      products={products} 
      analytics={analytics} 
      onSave={handleBack} 
    />
  );

  return (
    <MasterDataLayout
      title="Sales Orders"
      subtitle="Manage your customer orders."
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

function SalesOrderForm({ order, customers, products, analytics, onSave }: any) {
  const [formData, setFormData] = useState<any>(order || {
    customerId: "", orderDate: new Date().toISOString().split('T')[0], lines: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isNew = !order;
  const status = order?.status || "DRAFT";

  const handleChange = (k: string, v: any) => setFormData((prev: any) => ({ ...prev, [k]: v }));

  const handleLineChange = (index: number, k: string, v: any) => {
    const newLines = [...formData.lines];
    newLines[index][k] = v;
    
    if (k === 'productId') {
      const p = products.find((x: any) => x.id === v);
      if (p) newLines[index].unitPrice = p.salesPrice;
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
      if (isNew) {
        await fetch("/api/sales-orders", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        });
      } else {
        await fetch(`/api/sales-orders/${order.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        });
      }
      onSave();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAction = async (action: string) => {
    if (!order) return;
    setIsSubmitting(true);
    await fetch(`/api/sales-orders/${order.id}/${action}`, { method: "POST" });
    setIsSubmitting(false);
    onSave();
  };

  return (
    <div className="bg-white rounded-md shadow-sm border p-6">
      <div className="flex justify-between items-center mb-6 pb-4 border-b">
        <div>
          <h2 className="text-xl font-bold">{isNew ? "New Sales Order" : `SO-${order.orderNumber?.toString().padStart(5, "0")}`}</h2>
          {!isNew && order.invoice && (
            <div className="text-sm mt-1 font-medium">
              Linked Invoice: <a href={`/sales/invoices?id=${order.invoice.id}`} className="text-blue-600 hover:underline">INV/{order.invoice.id.slice(-8).toUpperCase()}</a> ({order.invoice.status})
            </div>
          )}
        </div>
        <div className="space-x-2">
          {status === "DRAFT" && !isNew && <Button variant="outline" onClick={() => handleAction("confirm")}>Confirm SO</Button>}
          {status === "CONFIRMED" && !order.invoice && <Button variant="outline" onClick={() => handleAction("create-invoice")}>Create Invoice</Button>}
          <Badge variant="outline" className="ml-4 text-sm px-3 py-1 bg-gray-50">{status}</Badge>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Customer</Label>
            <Select value={formData.customerId} onValueChange={v => handleChange("customerId", v)} disabled={!isNew && status !== "DRAFT"}>
              <SelectTrigger><SelectValue placeholder="Select Customer" /></SelectTrigger>
              <SelectContent>
                {customers.map((v: any) => (
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
                  <TableHead>Analytic Account</TableHead>
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
                      <Select value={line.analyticAccountId || "none"} onValueChange={v => handleLineChange(idx, "analyticAccountId", v === "none" ? null : v)} disabled={!isNew && status !== "DRAFT"}>
                        <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {analytics.map((a: any) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
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
              Save Sales Order
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
