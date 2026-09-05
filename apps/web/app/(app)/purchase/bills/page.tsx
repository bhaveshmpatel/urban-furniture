"use client";
import { useEffect, useState } from "react";
import { MasterDataLayout, ViewType } from "@/components/layout/MasterDataLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";

export default function VendorBillsPage() {
  const [view, setView] = useState<ViewType>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortOrder, setSortOrder] = useState("NEWEST");
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState<any>(null);

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
    if (id && bills.length > 0) {
      const bill = bills.find(b => b.id === id);
      if (bill) {
        handleRowClick(bill);
        window.history.replaceState({}, '', '/purchase/bills');
      }
    }
  }, [bills]);

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
    const res = await fetch(`/api/vendor-bills?${params.toString()}`);
    const json = await res.json();
    setBills(json.data || []);
    setTotalPages(json.metadata?.totalPages || 1);
    setLoading(false);
  };

  const fetchDependencies = async () => {
    const resV = await fetch("/api/contacts");
    setVendors((await resV.json()).filter((v: any) => v.type === "VENDOR" || v.type === "BOTH"));
    const resP = await fetch("/api/products");
    setProducts(await resP.json());
    const resB = await fetch("/api/reports/budget?status=CONFIRMED");
    setActiveBudgets(await resB.json());
  };

  const handleRowClick = async (b: any) => {
    const res = await fetch(`/api/vendor-bills/${b.id}`);
    setSelectedBill(await res.json());
    setView("form");
  };

  const handleNew = () => {
    setSelectedBill(null);
    setView("form");
  };

  const handleBack = () => {
    setView("list");
    fetchData();
  };

  const filteredBills = bills;

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
            <TableHead>Bill Number</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Source PO</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Total Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
          ) : filteredBills.length === 0 ? (
            <TableRow><TableCell colSpan={6} className="text-center py-8">No vendor bills found</TableCell></TableRow>
          ) : (
            filteredBills.map(b => (
              <TableRow key={b.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleRowClick(b)}>
                <TableCell className="font-medium text-uf-green">BILL-{b.id.slice(-8).toUpperCase()}</TableCell>
                <TableCell>{b.vendor?.name}</TableCell>
                <TableCell>{new Date(b.invoiceDate).toLocaleDateString()}</TableCell>
                <TableCell>{b.purchaseOrderId ? `PO-${b.purchaseOrderId.slice(-8).toUpperCase()}` : "-"}</TableCell>
                <TableCell><Badge variant="outline">{b.status}</Badge></TableCell>
                <TableCell className="text-right">₹{Number(b.totalAmount).toLocaleString()}</TableCell>
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
      {filteredBills.map(b => (
        <div key={b.id} onClick={() => handleRowClick(b)} className="bg-white border rounded-lg p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-uf-green">BILL-{b.id.slice(-8).toUpperCase()}</h3>
            <Badge variant="outline">{b.status}</Badge>
          </div>
          <div className="text-sm text-gray-800 font-medium mb-1">{b.vendor?.name}</div>
          <div className="text-xs text-gray-500 mb-2">{new Date(b.invoiceDate).toLocaleDateString()}</div>
          <div className="flex justify-between items-center text-sm border-t pt-2 mt-2">
            <div>
              <div className="font-medium">₹{Number(b.totalAmount).toLocaleString()}</div>
            </div>
            {b.purchaseOrderId && (
              <div className="text-xs text-blue-600">PO-{b.purchaseOrderId.slice(-8).toUpperCase()}</div>
            )}
          </div>
        </div>
      ))}
    </div>
    </div>
  );

  const renderForm = () => (
    <VendorBillForm 
      bill={selectedBill} 
      vendors={vendors} 
      products={products} 
      activeBudgets={activeBudgets} 
      onSave={handleBack} 
    />
  );

  return (
    <MasterDataLayout
      title="Vendor Bills"
      subtitle="Manage your vendor invoices and payments."
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

function VendorBillForm({ bill, vendors, products, activeBudgets, onSave }: any) {
  const [formData, setFormData] = useState<any>(bill || {
    vendorId: "", invoiceDate: new Date().toISOString().split('T')[0], dueDate: new Date().toISOString().split('T')[0], taxAmount: 0, lines: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(bill?.totalAmount || 0);
  const [paymentMethod, setPaymentMethod] = useState("BANK");

  const isNew = !bill;
  const status = bill?.status || "DRAFT";

  const handleChange = (k: string, v: any) => setFormData((prev: any) => ({ ...prev, [k]: v }));

  const handleLineChange = (index: number, k: string, v: any) => {
    const newLines = [...formData.lines];
    newLines[index][k] = v;
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

  const linesTotal = formData.lines.reduce((acc: number, l: any) => acc + (Number(l.quantity) * Number(l.unitPrice)), 0);
  const totalAmount = linesTotal + Number(formData.taxAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const payload = { ...formData, totalAmount };
    try {
      if (isNew) {
        await fetch("/api/vendor-bills", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        await fetch(`/api/vendor-bills/${bill.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }
      onSave();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAction = async (action: string) => {
    if (!bill) return;
    setIsSubmitting(true);
    const res = await fetch(`/api/vendor-bills/${bill.id}/${action}`, { method: "POST" });
    if (!res.ok) {
      const err = await res.json();
      alert(`Error: ${err.message || 'Failed to execute action'}`);
    }
    setIsSubmitting(false);
    onSave();
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await fetch(`/api/vendor-bills/${bill.id}/pay`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Number(paymentAmount), method: paymentMethod })
    });
    setIsSubmitting(false);
    setPayModalOpen(false);
    onSave();
  };

  return (
    <div className="bg-white rounded-md shadow-sm border p-6">
      <div className="flex justify-between items-center mb-6 pb-4 border-b">
        <div>
          <h2 className="text-xl font-bold">{isNew ? "New Vendor Bill" : `BILL-${bill.billNumber?.toString().padStart(5, "0")}`}</h2>
          {!isNew && bill.purchaseOrder && (
            <div className="text-sm mt-1 font-medium">
              Source PO: <a href={`/purchase/orders?id=${bill.purchaseOrderId}`} className="text-blue-600 hover:underline">PO-{bill.purchaseOrderId.slice(-8).toUpperCase()}</a>
            </div>
          )}
        </div>
        <div className="space-x-2">
          {status === "DRAFT" && !isNew && <Button variant="outline" onClick={() => handleAction("confirm")}>Confirm Bill</Button>}
          {status === "DRAFT" && !isNew && <Button variant="destructive" onClick={() => handleAction("cancel")}>Cancel</Button>}
          {(status === "CONFIRMED" || status === "PARTIALLY_PAID") && (
            <Dialog open={payModalOpen} onOpenChange={setPayModalOpen}>
              <DialogTrigger asChild><Button variant="default">Register Payment</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Register Payment</DialogTitle></DialogHeader>
                <form onSubmit={handlePay} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BANK">Bank</SelectItem>
                        <SelectItem value="CASH">Cash</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Amount (₹)</Label>
                    <Input type="number" step="0.01" required value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} />
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="w-full">Process Payment</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
          <Badge variant="outline" className="ml-4 text-sm px-3 py-1 bg-gray-50">{status}</Badge>
        </div>
      </div>

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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Bill Date</Label>
              <Input type="date" required value={formData.invoiceDate ? new Date(formData.invoiceDate).toISOString().split('T')[0] : ""} onChange={e => handleChange("invoiceDate", e.target.value)} disabled={!isNew && status !== "DRAFT"} />
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input type="date" required value={formData.dueDate ? new Date(formData.dueDate).toISOString().split('T')[0] : ""} onChange={e => handleChange("dueDate", e.target.value)} disabled={!isNew && status !== "DRAFT"} />
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">Bill Lines</h3>
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
                  <TableHead>Budget</TableHead>
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
                        <SelectTrigger><SelectValue placeholder="Select Budget" /></SelectTrigger>
                        <SelectContent>
                          {activeBudgets.map((b: any) => (
                            <SelectItem key={b.id} value={b.analyticAccountId}>
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
          
          <div className="flex justify-end mt-6">
            <div className="w-64 space-y-2 text-right">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal:</span>
                <span className="font-medium">₹{linesTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Tax Amount:</span>
                <div className="w-24">
                  <Input type="number" value={formData.taxAmount} onChange={e => handleChange("taxAmount", e.target.value)} disabled={!isNew && status !== "DRAFT"} className="text-right h-8" />
                </div>
              </div>
              <div className="flex justify-between border-t pt-2 text-lg">
                <span className="font-medium">Total:</span>
                <span className="font-bold">₹{totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {(isNew || status === "DRAFT") && (
          <div className="pt-4 flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              Save Vendor Bill
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
