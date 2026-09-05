"use client";
import { useEffect, useState } from "react";
import { MasterDataLayout, ViewType } from "@/components/layout/MasterDataLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function PaymentsPage() {
  const [view, setView] = useState<ViewType>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortOrder, setSortOrder] = useState("NEWEST");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    const res = await fetch(`/api/payments?${params.toString()}`);
    const json = await res.json();
    setData(json.data || []);
    setTotalPages(json.metadata?.totalPages || 1);
    setLoading(false);
  };

  const renderList = () => (
    <div className="bg-white border rounded-md shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Reference</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
          ) : data.length === 0 ? (
            <TableRow><TableCell colSpan={5} className="text-center py-8">No payments found.</TableCell></TableRow>
          ) : (
            data.map((p: any) => (
              <TableRow key={p.id}>
                <TableCell>{new Date(p.paymentDate).toLocaleDateString()}</TableCell>
                <TableCell>{p.contact?.name}</TableCell>
                <TableCell>{p.method}</TableCell>
                <TableCell>₹{Number(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                <TableCell>
                  {p.vendorBillId ? `BILL-${p.vendorBillId.slice(-5).toUpperCase()}` : p.customerInvoiceId ? `INV-${p.customerInvoiceId.slice(-5).toUpperCase()}` : ""}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <MasterDataLayout
      title="Payments"
      subtitle="View all incoming and outgoing payments."
      view={view}
      setView={setView}
      onNew={() => {}}
      hideNewButton
      onBack={() => {}}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      renderList={renderList}
      renderKanban={renderList}
      renderForm={() => <div></div>}
      pagination={{ page, totalPages, setPage }}
    />
  );
}
