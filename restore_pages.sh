#!/bin/bash

# Dashboard
cat << 'FILE' > apps/web/app/\(app\)/dashboard/page.tsx
"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingCart, Users, Package } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-uf-muted">Welcome to the Urban Furniture Accounting System.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-uf-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular">$45,231.89</div>
            <p className="text-xs text-uf-muted">+20.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Purchases</CardTitle>
            <ShoppingCart className="h-4 w-4 text-uf-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular">+2350</div>
            <p className="text-xs text-uf-muted">+180.1% from last month</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
FILE

# Contacts
cat << 'FILE' > apps/web/app/\(app\)/contacts/page.tsx
"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ContactsPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/contacts").then(r => r.json()).then(data => { setContacts(data || []); setLoading(false); });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
          <p className="text-uf-muted">Manage your customers and vendors.</p>
        </div>
        <Button className="bg-uf-green hover:bg-uf-green/90 text-white"><Plus className="mr-2 h-4 w-4" /> Add Contact</Button>
      </div>
      <div className="rounded-md border border-uf-border bg-uf-surface">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={4} className="text-center py-8">Loading...</TableCell></TableRow> : 
             contacts.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-8">No contacts found</TableCell></TableRow> :
             contacts.map(c => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell><Badge variant="outline">{c.type}</Badge></TableCell>
                <TableCell>{c.email || '-'}</TableCell>
                <TableCell>{c.mobile || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
FILE

# Products
cat << 'FILE' > apps/web/app/\(app\)/products/page.tsx
"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products").then(r => r.json()).then(data => { setProducts(data || []); setLoading(false); });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-uf-muted">Manage your inventory, goods, and services.</p>
        </div>
        <Button className="bg-uf-green hover:bg-uf-green/90 text-white"><Plus className="mr-2 h-4 w-4" /> Add Product</Button>
      </div>
      <div className="rounded-md border border-uf-border bg-uf-surface">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Sales Price</TableHead><TableHead className="text-right">Cost Price</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={4} className="text-center py-8">Loading...</TableCell></TableRow> : 
             products.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-8">No products found</TableCell></TableRow> :
             products.map(p => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell><Badge variant="outline">{p.type}</Badge></TableCell>
                <TableCell className="text-right tabular">${Number(p.salesPrice).toFixed(2)}</TableCell>
                <TableCell className="text-right tabular">${Number(p.costPrice).toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
FILE

# Sales
cat << 'FILE' > apps/web/app/\(app\)/sales/page.tsx
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
        <Button className="bg-uf-green hover:bg-uf-green/90 text-white"><Plus className="mr-2 h-4 w-4" /> Create Sales Order</Button>
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
FILE

# Purchases
cat << 'FILE' > apps/web/app/\(app\)/purchases/page.tsx
"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function PurchasesPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/purchase-orders").then(r => r.json()).then(data => { setOrders(data || []); setLoading(false); });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchases</h1>
          <p className="text-uf-muted">Manage your purchase orders and vendor bills.</p>
        </div>
        <Button className="bg-uf-green hover:bg-uf-green/90 text-white"><Plus className="mr-2 h-4 w-4" /> Create Purchase Order</Button>
      </div>
      <div className="rounded-md border border-uf-border bg-uf-surface">
        <Table>
          <TableHeader>
            <TableRow><TableHead>PO Number</TableHead><TableHead>Date</TableHead><TableHead>Vendor</TableHead><TableHead>Status</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={4} className="text-center py-8">Loading...</TableCell></TableRow> : 
             orders.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-8">No purchase orders found</TableCell></TableRow> :
             orders.map(o => (
              <TableRow key={o.id}>
                <TableCell className="font-medium">{o.id.slice(-8).toUpperCase()}</TableCell>
                <TableCell>{new Date(o.orderDate).toLocaleDateString()}</TableCell>
                <TableCell>{o.vendor?.name || 'Unknown'}</TableCell>
                <TableCell><Badge variant="outline">{o.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
FILE

