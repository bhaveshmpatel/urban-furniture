"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProducts = () => {
    setLoading(true);
    fetch("/api/products").then(r => r.json()).then(data => { setProducts(data || []); setLoading(false); });
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: fd.get('name'),
      type: fd.get('type'),
      salesPrice: Number(fd.get('salesPrice')),
      costPrice: Number(fd.get('costPrice')),
      category: fd.get('category') || undefined
    };
    
    await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    
    setIsSubmitting(false);
    setIsOpen(false);
    fetchProducts();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-uf-muted">Manage your inventory, goods, and services.</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-uf-green hover:bg-uf-green/90 text-white">
              <Plus className="mr-2 h-4 w-4" /> Add Product
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Product</DialogTitle>
            </DialogHeader>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Product Type</Label>
                <Select name="type" defaultValue="GOODS">
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GOODS">Goods</SelectItem>
                    <SelectItem value="SERVICE">Service</SelectItem>
                    <SelectItem value="COMBO">Combo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salesPrice">Sales Price ($)</Label>
                  <Input id="salesPrice" name="salesPrice" type="number" step="0.01" min="0" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="costPrice">Cost Price ($)</Label>
                  <Input id="costPrice" name="costPrice" type="number" step="0.01" min="0" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category (Optional)</Label>
                <Input id="category" name="category" />
              </div>
              <Button type="submit" className="w-full bg-uf-green hover:bg-uf-green/90 text-white" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Save Product"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border border-uf-border bg-uf-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Sales Price</TableHead>
              <TableHead className="text-right">Cost Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={4} className="text-center py-8">Loading...</TableCell></TableRow> : 
             products.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-8">No products found</TableCell></TableRow> :
             products.map(p => (
              <TableRow key={p.id} className="ledger-row cursor-pointer hover:bg-uf-bg">
                <TableCell className="font-medium text-uf-ink">{p.name}</TableCell>
                <TableCell><Badge variant="outline" className="bg-gray-50">{p.type}</Badge></TableCell>
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
