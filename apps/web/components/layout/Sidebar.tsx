"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, ShoppingCart, Receipt, CreditCard, BookOpen, PieChart, Building2, ChevronDown } from "lucide-react";
import { useState } from "react";

const NAV = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  {
    label: "Sales", icon: ShoppingCart,
    children: [
      { label: "Sales Orders", href: "/sales/orders" },
      { label: "Customer Invoices", href: "/sales/invoices" },
    ],
  },
  {
    label: "Purchase", icon: Receipt,
    children: [
      { label: "Purchase Orders", href: "/purchase/orders" },
      { label: "Vendor Bills", href: "/purchase/bills" },
    ],
  },
  { label: "Payments", icon: CreditCard, href: "/payments" },
  {
    label: "Accounting", icon: BookOpen,
    children: [
      { label: "Chart of Accounts", href: "/accounting/chart-of-accounts" },
      { label: "Journals", href: "/accounting/journals" },
      { label: "Journal Entries", href: "/accounting/journal-entries" },
      { label: "Analytic Accounts", href: "/accounting/analytic-accounts" },
      { label: "Budgets", href: "/accounting/budgets" },
    ],
  },
  {
    label: "Reports", icon: PieChart,
    children: [
      { label: "Balance Sheet", href: "/reports/balance-sheet" },
      { label: "Profit & Loss", href: "/reports/profit-and-loss" },
      { label: "Budget Report", href: "/reports/budget" },
    ],
  },
  {
    label: "Master Data", icon: Building2,
    children: [
      { label: "Contacts", href: "/contacts" },
      { label: "Products", href: "/products" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname() || "";
  const [expanded, setExpanded] = useState<string | null>("Master Data");

  const toggle = (label: string) => setExpanded(p => p === label ? null : label);

  return (
    <aside className="w-64 flex-shrink-0 bg-uf-surface border-r border-uf-border h-screen overflow-y-auto flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-uf-border">
        <span className="font-serif font-bold text-uf-green text-xl tracking-tight">Urban Furniture</span>
      </div>
      <nav className="flex-1 py-4 px-3 space-y-1">
        {NAV.map((item) => {
          if (!item.children) {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={cn("flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", active ? "bg-uf-green text-white font-medium shadow-sm" : "text-uf-ink hover:bg-uf-green-light hover:text-uf-green")}>
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          }
          const isExpanded = expanded === item.label;
          const anyChildActive = item.children.some(c => pathname.startsWith(c.href));
          return (
            <div key={item.label} className="mb-1">
              <button onClick={() => toggle(item.label)} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", anyChildActive && !isExpanded ? "text-uf-green font-medium" : "text-uf-ink hover:bg-uf-green-light hover:text-uf-green")}>
                <item.icon size={18} />
                <span className="flex-1 text-left font-medium">{item.label}</span>
                <ChevronDown size={16} className={cn("transition-transform opacity-50", isExpanded && "rotate-180")} />
              </button>
              {isExpanded && (
                <div className="ml-9 mt-1 space-y-1">
                  {item.children.map((child) => {
                    const active = pathname.startsWith(child.href);
                    return (
                      <Link key={child.href} href={child.href} className={cn("block px-3 py-1.5 rounded-md text-sm transition-colors", active ? "bg-uf-green text-white font-medium shadow-sm" : "text-uf-muted hover:bg-uf-green-light hover:text-uf-green")}>
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
