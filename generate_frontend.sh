#!/bin/bash
mkdir -p apps/web/app/\(app\)/dashboard
mkdir -p apps/web/app/\(app\)/contacts
mkdir -p apps/web/app/\(app\)/products
mkdir -p apps/web/app/\(app\)/sales
mkdir -p apps/web/app/\(app\)/purchases
mkdir -p apps/web/app/\(auth\)/login
mkdir -p apps/web/app/\(auth\)/signup

cat << 'FILE' > apps/web/app/page.tsx
import Link from "next/link";
export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-uf-bg text-uf-ink p-4">
      <h1 className="text-4xl font-bold font-serif mb-4 text-uf-green">Urban Furniture</h1>
      <p className="mb-8 text-uf-muted">Next-generation Accounting Ledger</p>
      <div className="space-x-4">
        <Link href="/login" className="px-6 py-2 bg-white rounded border border-uf-border">Log In</Link>
        <Link href="/signup" className="px-6 py-2 bg-uf-green text-white rounded">Sign Up</Link>
      </div>
    </div>
  );
}
FILE

cat << 'FILE' > apps/web/app/\(auth\)/layout.tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-uf-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-serif text-2xl font-semibold text-uf-green tracking-tight">Urban Furniture</h1>
        </div>
        {children}
      </div>
    </div>
  );
}
FILE

cat << 'FILE' > apps/web/app/\(app\)/layout.tsx
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-uf-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
FILE

cat << 'FILE' > apps/web/app/\(app\)/dashboard/page.tsx
export default function DashboardPage() {
  return <h1 className="text-2xl font-bold">Dashboard</h1>;
}
FILE

cat << 'FILE' > apps/web/app/\(app\)/contacts/page.tsx
export default function ContactsPage() {
  return <h1 className="text-2xl font-bold">Contacts</h1>;
}
FILE

cat << 'FILE' > apps/web/app/\(app\)/products/page.tsx
export default function ProductsPage() {
  return <h1 className="text-2xl font-bold">Products</h1>;
}
FILE

cat << 'FILE' > apps/web/app/\(app\)/sales/page.tsx
export default function SalesPage() {
  return <h1 className="text-2xl font-bold">Sales</h1>;
}
FILE

cat << 'FILE' > apps/web/app/\(app\)/purchases/page.tsx
export default function PurchasesPage() {
  return <h1 className="text-2xl font-bold">Purchases</h1>;
}
FILE

echo "Frontend scaffolded!"
