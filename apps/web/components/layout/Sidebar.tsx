"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, ShoppingCart, Receipt, CreditCard, BookOpen, PieChart, Building2, ChevronDown, LogOut } from "lucide-react";
import { useState } from "react";

const NAV = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Sales Orders", icon: ShoppingCart, href: "/sales/orders" },
  { label: "Purchase Orders", icon: Receipt, href: "/purchase/orders" },
  { label: "Payments", icon: CreditCard, href: "/payments" },
  {
    label: "Accounting", icon: BookOpen,
    children: [
      { label: "Customer Invoices", href: "/sales/invoices" },
      { label: "Vendor Bills", href: "/purchase/bills" },
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
      { label: "Users", href: "/users" },
    ],
  },
];

import { useSession, signOut } from "next-auth/react";

export function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname() || "";
  const [expanded, setExpanded] = useState<string | null>("Master Data");

  const toggle = (label: string) => setExpanded(p => p === label ? null : label);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const role = (session?.user as any)?.role;
  const isUser = role === "CONTACT";

  // Filter NAV items based on role
  let displayNav = isUser 
    ? [{ label: "My Documents", icon: Receipt, href: "/portal" }] 
    : NAV;

  if (role === "ACCOUNTANT") {
    displayNav = displayNav.map(item => {
      if (item.label === "Master Data" && item.children) {
        return {
          ...item,
          children: item.children.filter(c => c.label !== "Users")
        };
      }
      return item;
    });
  }

  return (
    <aside className="w-64 flex-shrink-0 bg-white/40 backdrop-blur-xl border-r border-white/40 h-screen overflow-y-auto flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] relative z-10">
      <div className="h-16 flex items-center px-6 border-b border-white/30">
        <div className="w-8 h-8 bg-gradient-to-tr from-uf-green to-teal-400 rounded-xl mr-3 shadow-sm flex items-center justify-center">
          <span className="text-white font-bold font-serif">U</span>
        </div>
        <span className="font-serif font-bold text-slate-800 text-xl tracking-tight">Urban<span className="text-uf-green">Furniture</span></span>
      </div>
      <nav className="flex-1 py-6 px-4 space-y-1.5">
        {displayNav.map((item) => {
          if (!item.children) {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200", active ? "bg-white/80 text-uf-green font-semibold shadow-sm ring-1 ring-black/5" : "text-slate-600 hover:bg-white/60 hover:text-uf-green")}>
                <item.icon size={18} className={active ? "text-uf-green" : "text-slate-400"} />
                {item.label}
              </Link>
            );
          }
          const isExpanded = expanded === item.label;
          const anyChildActive = item.children.some(c => pathname.startsWith(c.href));
          return (
            <div key={item.label} className="mb-2">
              <button onClick={() => toggle(item.label)} className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200", anyChildActive && !isExpanded ? "text-uf-green font-semibold" : "text-slate-600 hover:bg-white/60 hover:text-uf-green")}>
                <item.icon size={18} className={anyChildActive ? "text-uf-green" : "text-slate-400"} />
                <span className="flex-1 text-left font-medium">{item.label}</span>
                <ChevronDown size={16} className={cn("transition-transform duration-300 opacity-50", isExpanded && "rotate-180")} />
              </button>
              {isExpanded && (
                <div className="ml-4 pl-4 mt-1 space-y-1 border-l border-slate-200/50">
                  {item.children.map((child) => {
                    const active = pathname.startsWith(child.href);
                    return (
                      <Link key={child.href} href={child.href} className={cn("block px-3 py-2 rounded-lg text-sm transition-all duration-200 relative", active ? "text-uf-green font-semibold bg-white/60 shadow-sm" : "text-slate-500 hover:bg-white/40 hover:text-uf-green")}>
                        {active && <span className="absolute left-[-17px] top-1/2 -translate-y-1/2 w-1 h-4 bg-uf-green rounded-full" />}
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
      <div className="p-4 border-t border-white/30 bg-white/20">
        <div className="flex items-center justify-between px-2 bg-white/50 backdrop-blur-md p-2 rounded-xl shadow-sm ring-1 ring-black/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-tr from-uf-green to-teal-500 rounded-full flex items-center justify-center text-white font-medium shrink-0 shadow-inner text-sm">
              {session?.user?.name?.charAt(0) || "U"}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-800 line-clamp-1">{session?.user?.name || "User Profile"}</span>
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">{role}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-colors p-1.5 hover:bg-red-50 rounded-lg" title="Sign out">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
