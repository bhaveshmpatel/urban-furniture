"use client";
import { useEffect, useState } from "react";
import { MasterDataLayout, ViewType } from "@/components/layout/MasterDataLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, CreditCard } from "lucide-react";

export default function PortalPage() {
  const [view, setView] = useState<ViewType>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const res = await fetch("/api/portal/my-documents");
    if (!res.ok) {
      if (res.status === 403) alert("Access Denied");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setDocuments(data || []);
    setLoading(false);
  };

  const filteredDocs = documents.filter(d => {
    const searchMatch = d.id.toLowerCase().includes(searchQuery.toLowerCase());
    return searchMatch;
  });

  const handleRowClick = (doc: any) => {
    setSelectedDoc(doc);
    setView("form");
  };

  const handleBack = () => {
    setView("list");
    fetchData();
  };

  const handlePayClick = (doc: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDoc(doc);
    setPaymentModalOpen(true);
  };

  const renderList = () => (
    <div className="rounded-md border border-uf-border bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Number</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Amount Paid</TableHead>
            <TableHead>Status</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={8} className="text-center py-8">Loading...</TableCell></TableRow>
          ) : filteredDocs.length === 0 ? (
            <TableRow><TableCell colSpan={8} className="text-center py-8">No documents found</TableCell></TableRow>
          ) : (
            filteredDocs.map(d => {
              const isPaid = d.status === "PAID";
              const isBill = d.documentType === "VENDOR_BILL";
              const prefix = isBill ? "BILL" : "INV";
              return (
                <TableRow key={d.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleRowClick(d)}>
                  <TableCell>{isBill ? "Vendor Bill" : "Customer Invoice"}</TableCell>
                  <TableCell className="font-medium">{prefix}-{d.id.slice(-8).toUpperCase()}</TableCell>
                  <TableCell>{new Date(d.invoiceDate).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(d.dueDate).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right font-medium">₹{Number(d.totalAmount).toLocaleString()}</TableCell>
                  <TableCell className="text-right text-uf-green font-medium">₹{Number(d.amountPaid || 0).toLocaleString()}</TableCell>
                  <TableCell><Badge variant="outline">{d.status}</Badge></TableCell>
                  <TableCell>
                    {!isPaid && (
                      <Button size="sm" onClick={(e) => handlePayClick(d, e)}>
                        <CreditCard className="h-4 w-4 mr-2" /> Pay
                      </Button>
                    )}
                  </TableCell>
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
      {filteredDocs.map(d => {
        const isPaid = d.status === "PAID";
        const isBill = d.documentType === "VENDOR_BILL";
        const prefix = isBill ? "BILL" : "INV";
        return (
          <div key={d.id} onClick={() => handleRowClick(d)} className="bg-white border rounded-lg p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold">{prefix}-{d.id.slice(-8).toUpperCase()}</h3>
              <Badge variant="outline">{d.status}</Badge>
            </div>
            <div className="text-sm text-gray-800 font-medium mb-1">{isBill ? "Vendor Bill" : "Customer Invoice"}</div>
            <div className="text-xs text-gray-500 mb-2">Due: {new Date(d.dueDate).toLocaleDateString()}</div>
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium">Total: ₹{Number(d.totalAmount).toLocaleString()}</span>
              {!isPaid && (
                <Button size="sm" variant="secondary" onClick={(e) => handlePayClick(d, e)}>
                  Pay
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderForm = () => {
    if (!selectedDoc) return null;
    const isBill = selectedDoc.documentType === "VENDOR_BILL";
    const prefix = isBill ? "BILL" : "INV";
    return (
      <div className="bg-white rounded-md shadow-sm border p-6">
        <div className="flex justify-between items-center mb-6 pb-4 border-b">
          <div>
            <h2 className="text-xl font-bold">{prefix}-{selectedDoc.id.slice(-8).toUpperCase()}</h2>
            <div className="text-sm text-gray-500 mt-1">{isBill ? "Vendor Bill" : "Customer Invoice"}</div>
          </div>
          <div className="space-x-2">
            {selectedDoc.status !== "PAID" && (
              <Button onClick={() => setPaymentModalOpen(true)}>
                <CreditCard className="h-4 w-4 mr-2" /> Pay Now
              </Button>
            )}
            <Badge variant="outline" className="ml-4 text-sm px-3 py-1 bg-gray-50">{selectedDoc.status}</Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <Label className="text-gray-500 text-xs">Date</Label>
            <div className="font-medium">{new Date(selectedDoc.invoiceDate).toLocaleDateString()}</div>
          </div>
          <div>
            <Label className="text-gray-500 text-xs">Due Date</Label>
            <div className="font-medium">{new Date(selectedDoc.dueDate).toLocaleDateString()}</div>
          </div>
          <div>
            <Label className="text-gray-500 text-xs">Total Amount</Label>
            <div className="font-medium text-lg">₹{Number(selectedDoc.totalAmount).toLocaleString()}</div>
          </div>
          <div>
            <Label className="text-gray-500 text-xs">Amount Paid</Label>
            <div className="font-medium text-lg text-uf-green">₹{Number(selectedDoc.amountPaid || 0).toLocaleString()}</div>
          </div>
        </div>

        <div className="text-sm text-gray-500 italic">
          This is a read-only view of your document. To make a payment, click the Pay button above.
        </div>
      </div>
    );
  };

  return (
    <>
      <MasterDataLayout
        title="My Documents"
        subtitle="View and pay your invoices and bills."
        view={view}
        setView={setView}
        onNew={() => {}} // hidden in UI
        hideNewButton
        onBack={handleBack}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        renderList={renderList}
        renderKanban={renderKanban}
        renderForm={renderForm}
      />
      
      {/* Payment Modal */}
      {selectedDoc && (
        <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Make a Payment</DialogTitle>
            </DialogHeader>
            <PaymentForm 
              doc={selectedDoc} 
              onComplete={() => {
                setPaymentModalOpen(false);
                fetchData();
                if (view === "form") setView("list");
              }} 
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

function PaymentForm({ doc, onComplete }: any) {
  const amountDue = Number(doc.totalAmount) - Number(doc.amountPaid || 0);
  const [amount, setAmount] = useState(amountDue.toString());
  const [method, setMethod] = useState("BANK_TRANSFER");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/portal/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: doc.id,
          documentType: doc.documentType,
          amount,
          method
        })
      });
      if (res.ok) {
        alert("Payment successful");
        onComplete();
      } else {
        const error = await res.json();
        alert("Payment failed: " + error.error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label>Amount to Pay</Label>
        <Input type="number" step="0.01" max={amountDue} value={amount} onChange={e => setAmount(e.target.value)} required />
        <p className="text-xs text-gray-500">Maximum: ₹{amountDue.toLocaleString()}</p>
      </div>
      <div className="space-y-2">
        <Label>Payment Method</Label>
        <Select value={method} onValueChange={setMethod}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
            <SelectItem value="CASH">Cash</SelectItem>
            <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="pt-4 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => onComplete()}>Cancel</Button>
        <Button type="submit" disabled={loading}>{loading ? "Processing..." : "Submit Payment"}</Button>
      </div>
    </form>
  );
}
