"use client";
import { useEffect, useState } from "react";
import { MasterDataLayout, ViewType } from "@/components/layout/MasterDataLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ProductsPage() {
  const [view, setView] = useState<ViewType>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortOrder, setSortOrder] = useState("NEWEST");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

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
    const res = await fetch(`/api/products?${params.toString()}`);
    const json = await res.json();
    setProducts(json.data || []);
    setTotalPages(json.metadata?.totalPages || 1);
    setLoading(false);
  };

  const handleRowClick = (c: any) => {
    setSelectedProduct(c);
    setView("form");
  };

  const handleNew = () => {
    setSelectedProduct(null);
    setView("form");
  };

  const handleBack = () => {
    setView("list");
    fetchData();
  };

  const filteredProducts = products;

  const renderList = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Image</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Sales Price</TableHead>
            <TableHead>Cost</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow>
          ) : filteredProducts.length === 0 ? (
            <TableRow><TableCell colSpan={7} className="text-center py-8">No products found</TableCell></TableRow>
          ) : (
            filteredProducts.map(p => (
              <TableRow key={p.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleRowClick(p)}>
                <TableCell><input type="checkbox" onClick={(e) => e.stopPropagation()} /></TableCell>
                <TableCell>
                  <Avatar className="h-8 w-8 rounded-sm">
                    <AvatarImage src={p.imageUrl || ""} />
                    <AvatarFallback className="rounded-sm">{p.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell className="font-medium text-uf-green">{p.name}</TableCell>
                <TableCell>{p.category || "-"}</TableCell>
                <TableCell><Badge variant="outline">{p.type}</Badge></TableCell>
                <TableCell>₹{Number(p.salesPrice).toLocaleString()}</TableCell>
                <TableCell>₹{Number(p.costPrice).toLocaleString()}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  const renderKanban = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {filteredProducts.map(p => (
        <div key={p.id} onClick={() => handleRowClick(p)} className="group bg-white/80 backdrop-blur-sm border border-white ring-1 ring-slate-200/50 rounded-2xl p-5 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 cursor-pointer">
          <div className="flex items-start space-x-4 mb-3">
            <Avatar className="h-16 w-16 rounded-md flex-shrink-0">
              <AvatarImage src={p.imageUrl || ""} />
              <AvatarFallback className="rounded-md">{p.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="overflow-hidden">
              <h3 className="font-bold text-uf-green truncate">{p.name}</h3>
              <p className="text-xs text-gray-500 truncate mb-1">{p.category || "No category"}</p>
              <Badge variant="secondary" className="text-xs">{p.type}</Badge>
            </div>
          </div>
          <div className="flex justify-between items-center text-sm border-t pt-2 mt-2">
            <div>
              <div className="text-xs font-medium text-slate-400 mt-1 flex items-center">Price</div>
              <div className="font-medium">₹{Number(p.salesPrice).toLocaleString()}</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-medium text-slate-400 mt-1 flex items-center">Cost</div>
              <div className="font-medium">₹{Number(p.costPrice).toLocaleString()}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderForm = () => <ProductForm product={selectedProduct} onSave={handleBack} />;

  return (
    <MasterDataLayout
      title="Products"
      subtitle="Manage your product catalog, prices, and categories."
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

function ProductForm({ product, onSave }: any) {
  const [formData, setFormData] = useState<any>(product || {
    name: "", category: "", salesPrice: "", costPrice: "", type: "GOODS", imageUrl: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isNew = !product;

  const handleChange = (k: string, v: any) => setFormData((prev: any) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const payload = {
      ...formData,
      salesPrice: Number(formData.salesPrice),
      costPrice: Number(formData.costPrice),
    };

    try {
      if (isNew) {
        await fetch("/api/products", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        await fetch(`/api/products/${product.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }
      onSave();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async () => {
    if (!product) return;
    setIsSubmitting(true);
    await fetch(`/api/products/${product.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isArchived: true })
    });
    setIsSubmitting(false);
    onSave();
  };

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-sm border border-white/80 ring-1 ring-slate-200/50 p-6 md:p-8 mb-8">
      <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-200/60">
        <h2 className="text-xl font-bold">{isNew ? "New Product" : formData.name}</h2>
        <div className="space-x-2">
          {!isNew && <Button variant="destructive" onClick={handleArchive}>Archive</Button>}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Product Name</Label>
            <Input required value={formData.name || ""} onChange={e => handleChange("name", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Input placeholder="Type to create or select category..." value={formData.category || ""} onChange={e => handleChange("category", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Product Type</Label>
            <Select value={formData.type} onValueChange={v => handleChange("type", v)}>
              <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="GOODS">Goods</SelectItem>
                <SelectItem value="SERVICE">Service</SelectItem>
                <SelectItem value="COMBO">Combo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Image URL</Label>
            <Input placeholder="https://..." value={formData.imageUrl || ""} onChange={e => handleChange("imageUrl", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Sales Price (₹)</Label>
            <Input type="number" required value={formData.salesPrice || ""} onChange={e => handleChange("salesPrice", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Cost Price (₹)</Label>
            <Input type="number" required value={formData.costPrice || ""} onChange={e => handleChange("costPrice", e.target.value)} />
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <Button type="submit" disabled={isSubmitting} >
            {isNew ? "Create Product" : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
