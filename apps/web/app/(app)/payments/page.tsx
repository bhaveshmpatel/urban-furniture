"use client";
import { useEffect, useState } from "react";
import { MasterDataLayout, ViewType } from "@/components/layout/MasterDataLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";

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
                  {p.vendorBillId ? (
                    <Link href={`/purchase/bills?id=${p.vendorBillId}`} className="text-blue-600 hover:underline">
                      BILL-{p.vendorBillId.slice(-5).toUpperCase()}
                    </Link>
                  ) : p.customerInvoiceId ? (
                    <Link href={`/sales/invoices?id=${p.customerInvoiceId}`} className="text-blue-600 hover:underline">
                      INV-{p.customerInvoiceId.slice(-5).toUpperCase()}
                    </Link>
                  ) : ""}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  const renderKanban = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {loading ? (
        <div className="col-span-full text-center py-8">Loading...</div>
      ) : data.length === 0 ? (
        <div className="col-span-full text-center py-8">No payments found.</div>
      ) : (
        data.map((p: any) => (
          <div key={p.id} className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-uf-ink truncate pr-2" title={p.contact?.name}>{p.contact?.name || "Unknown"}</h3>
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md whitespace-nowrap">
                {p.method}
              </span>
            </div>
            <div className="text-sm text-gray-500 mb-2">
              Date: {new Date(p.paymentDate).toLocaleDateString()}
            </div>
            <div className="text-sm text-gray-500 mb-3">
              Ref: {p.vendorBillId ? (
                <Link href={`/purchase/bills?id=${p.vendorBillId}`} className="text-blue-600 hover:underline">
                  BILL-{p.vendorBillId.slice(-5).toUpperCase()}
                </Link>
              ) : p.customerInvoiceId ? (
                <Link href={`/sales/invoices?id=${p.customerInvoiceId}`} className="text-blue-600 hover:underline">
                  INV-{p.customerInvoiceId.slice(-5).toUpperCase()}
                </Link>
              ) : "N/A"}
            </div>
            <div className="flex justify-end items-center text-sm border-t pt-3 mt-3">
              <span className="font-medium text-lg text-uf-green">₹{Number(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        ))
      )}
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
      renderKanban={renderKanban}
      renderForm={() => <div></div>}
      pagination={{ page, totalPages, setPage }}
    />
  );
}
