"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SalesPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sales-orders").then(r => r.json()).then(data => { setOrders(data || []); setLoading(false); });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales</h1>
          <p className="text-uf-muted">Manage your sales orders and customer invoices.</p>
        </div>
        <Button ><Plus className="mr-2 h-4 w-4" /> Create Sales Order</Button>
      </div>
      <div className="rounded-md border border-uf-border bg-uf-surface">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Order #</TableHead><TableHead>Date</TableHead><TableHead>Customer</TableHead><TableHead>Status</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={4} className="text-center py-8">Loading...</TableCell></TableRow> : 
             orders.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-8">No sales orders found</TableCell></TableRow> :
             orders.map(o => (
              <TableRow key={o.id}>
                <TableCell className="font-medium">{o.id.slice(-8).toUpperCase()}</TableCell>
                <TableCell>{new Date(o.orderDate).toLocaleDateString()}</TableCell>
                <TableCell>{o.customer?.name || 'Unknown'}</TableCell>
                <TableCell><Badge variant="outline">{o.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
