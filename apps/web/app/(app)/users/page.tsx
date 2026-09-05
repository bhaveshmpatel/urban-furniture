"use client";
import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";

export default function UsersPage() {
  const [data, setData] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "form">("list");
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    fetch("/api/users").then(r => r.json()).then(d => { setData(d); setLoading(false); });
    fetch("/api/contacts").then(r => r.json()).then(d => setContacts(d));
  }, []);

  const handleSave = async () => {
    const isNew = !form.id;
    const res = await fetch(`/api/users${isNew ? "" : `/${form.id}`}`, {
      method: isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    if (res.ok) {
      const saved = await res.json();
      if (isNew) setData([saved, ...data]);
      else setData(data.map(d => d.id === saved.id ? saved : d));
      setView("list");
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    setData(data.map(d => d.id === id ? { ...d, isActive: false } : d));
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        {view === "list" && (
          <Button onClick={() => { setForm({}); setView("form"); }}><Plus className="h-4 w-4 mr-2" /> New User</Button>
        )}
      </div>

      {view === "list" ? (
        <div className="bg-white border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Login ID</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Active</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((u: any) => (
                <TableRow key={u.id}>
                  <TableCell>{u.loginId}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.role}</TableCell>
                  <TableCell>{u.isActive ? "Yes" : "No"}</TableCell>
                  <TableCell>
                    <Button variant="ghost" onClick={() => { setForm(u); setView("form"); }}>Edit</Button>
                    {u.isActive && <Button variant="ghost" className="text-red-600" onClick={() => handleDelete(u.id)}>Deactivate</Button>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="bg-white p-6 border rounded-md max-w-lg">
          <div className="space-y-4">
            <div>
              <Label>Login ID</Label>
              <Input value={form.loginId || ""} onChange={e => setForm({ ...form, loginId: e.target.value })} disabled={!!form.id} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email || ""} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={form.role || "CONTACT"} onValueChange={v => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="ACCOUNTANT">Accountant</SelectItem>
                  <SelectItem value="CONTACT">Contact (Portal)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.role === "CONTACT" && (
              <div>
                <Label>Linked Contact</Label>
                <Select value={form.contactId || ""} onValueChange={v => setForm({ ...form, contactId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select a contact" /></SelectTrigger>
                  <SelectContent>
                    {contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Password {form.id && "(Leave blank to keep unchanged)"}</Label>
              <Input type="password" value={form.password || ""} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Enter new password" />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setView("list")}>Cancel</Button>
              <Button onClick={handleSave}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
