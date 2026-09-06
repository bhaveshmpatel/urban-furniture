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

export default function ContactsPage() {
  const [view, setView] = useState<ViewType>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortOrder, setSortOrder] = useState("NEWEST");
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<any>(null);

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
    const res = await fetch(`/api/contacts?${params.toString()}`);
    const json = await res.json();
    setContacts(json.data || []);
    setTotalPages(json.metadata?.totalPages || 1);
    setLoading(false);
  };

  const handleRowClick = (c: any) => {
    setSelectedContact(c);
    setView("form");
  };

  const handleNew = () => {
    setSelectedContact(null);
    setView("form");
  };

  const handleBack = () => {
    setView("list");
    fetchData();
  };

  const filteredContacts = contacts;

  const renderList = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Image</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
          ) : filteredContacts.length === 0 ? (
            <TableRow><TableCell colSpan={5} className="text-center py-8">No contacts found</TableCell></TableRow>
          ) : (
            filteredContacts.map(c => (
              <TableRow key={c.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleRowClick(c)}>
                <TableCell><input type="checkbox" onClick={(e) => e.stopPropagation()} /></TableCell>
                <TableCell>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={c.imageUrl || ""} />
                    <AvatarFallback>{c.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell className="font-medium text-uf-green">{c.name}</TableCell>
                <TableCell>{c.email || "-"}</TableCell>
                <TableCell>{c.mobile || "-"}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  const renderKanban = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {filteredContacts.map(c => (
        <div key={c.id} onClick={() => handleRowClick(c)} className="bg-white border rounded-lg p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow flex items-center space-x-4">
          <Avatar className="h-12 w-12 flex-shrink-0">
            <AvatarImage src={c.imageUrl || ""} />
            <AvatarFallback>{c.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="overflow-hidden">
            <h3 className="font-bold text-uf-green truncate">{c.name}</h3>
            <p className="text-sm text-gray-500 truncate">{c.email || "No email"}</p>
            <p className="text-sm text-gray-500 truncate">{c.mobile || "No phone"}</p>
          </div>
        </div>
      ))}
    </div>
  );

  const renderForm = () => <ContactForm contact={selectedContact} onSave={handleBack} />;

  return (
    <MasterDataLayout
      title="Contacts"
      subtitle="Manage your customers and vendors."
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

function ContactForm({ contact, onSave }: any) {
  const [formData, setFormData] = useState<any>(contact || {
    name: "", email: "", mobile: "", type: "CUSTOMER", street: "", city: "", state: "", zip: "", country: "", imageUrl: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isNew = !contact;

  const handleChange = (k: string, v: any) => setFormData((prev: any) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (isNew) {
        await fetch("/api/contacts", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        });
      } else {
        await fetch(`/api/contacts/${contact.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        });
      }
      onSave();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async () => {
    if (!contact) return;
    setIsSubmitting(true);
    await fetch(`/api/contacts/${contact.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isArchived: true })
    });
    setIsSubmitting(false);
    onSave();
  };

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-sm border border-white/80 ring-1 ring-slate-200/50 p-6 md:p-8 mb-8">
      <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-200/60">
        <h2 className="text-xl font-bold">{isNew ? "New Contact" : formData.name}</h2>
        <div className="space-x-2">
          {!isNew && <Button variant="destructive" onClick={handleArchive}>Archive</Button>}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Contact Name</Label>
            <Input required value={formData.name || ""} onChange={e => handleChange("name", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={formData.type} onValueChange={v => handleChange("type", v)}>
              <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="CUSTOMER">Customer</SelectItem>
                <SelectItem value="VENDOR">Vendor</SelectItem>
                <SelectItem value="BOTH">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={formData.email || ""} onChange={e => handleChange("email", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={formData.mobile || ""} onChange={e => handleChange("mobile", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Image URL</Label>
            <Input placeholder="https://..." value={formData.imageUrl || ""} onChange={e => handleChange("imageUrl", e.target.value)} />
          </div>
        </div>

        <h3 className="font-bold text-lg mt-8 mb-4 border-b pb-2">Address</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2 col-span-2">
            <Label>Street</Label>
            <Input value={formData.street || ""} onChange={e => handleChange("street", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>City</Label>
            <Input value={formData.city || ""} onChange={e => handleChange("city", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>State</Label>
            <Input value={formData.state || ""} onChange={e => handleChange("state", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Pincode (Zip)</Label>
            <Input value={formData.zip || ""} onChange={e => handleChange("zip", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Country</Label>
            <Input value={formData.country || ""} onChange={e => handleChange("country", e.target.value)} />
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <Button type="submit" disabled={isSubmitting} >
            {isNew ? "Create Contact" : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
