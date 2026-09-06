"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingCart, Receipt, Users, Package,
  BarChart2, BookOpen, FileText, TrendingUp,
  DollarSign, Layers, CreditCard, PieChart
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const QUICK_ACCESS = [
  {
    label: "Sales",
    color: "bg-blue-50 border-blue-200",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    items: [
      { label: "Sales Order", href: "/sales/orders", icon: ShoppingCart },
      { label: "Sale Invoice", href: "/sales/invoices", icon: Receipt },
    ],
  },
  {
    label: "Purchase",
    color: "bg-amber-50 border-amber-200",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    items: [
      { label: "Purchase Order", href: "/purchase/orders", icon: ShoppingCart },
      { label: "Purchase Bill", href: "/purchase/bills", icon: Receipt },
    ],
  },
  {
    label: "Account",
    color: "bg-purple-50 border-purple-200",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    items: [
      { label: "Contacts", href: "/contacts", icon: Users },
      { label: "Products", href: "/products", icon: Package },
      { label: "Analytic Accounts", href: "/accounting/analytic-accounts", icon: Layers },
      { label: "Budgets", href: "/accounting/budgets", icon: DollarSign },
      { label: "Chart of Accounts", href: "/accounting/chart-of-accounts", icon: BookOpen },
      { label: "Journals", href: "/accounting/journals", icon: FileText },
      { label: "Journal Entries", href: "/accounting/journal-entries", icon: CreditCard },
    ],
  },
  {
    label: "Reports",
    color: "bg-green-50 border-green-200",
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    items: [
      { label: "Balance Sheet", href: "/reports/balance-sheet", icon: BarChart2 },
      { label: "Profit & Loss", href: "/reports/profit-and-loss", icon: TrendingUp },
      { label: "Budget Report", href: "/accounting/budgets", icon: PieChart },
    ],
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports/dashboard")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const soAll = data?.salesOrders ? Object.values(data.salesOrders as Record<string, number>).reduce((a: any, b: any) => a + b, 0) : 0;
  const poAll = data?.purchaseOrders ? Object.values(data.purchaseOrders as Record<string, number>).reduce((a: any, b: any) => a + b, 0) : 0;
  const budgetPlanned = data ? Number(data.budgetSummary?.totalPlanned || 0) : 0;
  const budgetActual = data ? Number(data.budgetSummary?.totalActual || 0) : 0;

  const statCards = [
    {
      title: "Sales Orders",
      color: "border-l-blue-500",
      bg: "bg-blue-50",
      icon: ShoppingCart,
      iconColor: "text-blue-500",
      href: "/sales/orders",
      tiles: [
        { label: "All", value: soAll },
        { label: "Confirmed", value: data?.salesOrders?.CONFIRMED || 0 },
        { label: "Draft", value: data?.salesOrders?.DRAFT || 0 },
      ],
    },
    {
      title: "Purchase Orders",
      color: "border-l-amber-500",
      bg: "bg-amber-50",
      icon: ShoppingCart,
      iconColor: "text-amber-500",
      href: "/purchase/orders",
      tiles: [
        { label: "All", value: poAll },
        { label: "Confirmed", value: data?.purchaseOrders?.CONFIRMED || 0 },
        { label: "Draft", value: data?.purchaseOrders?.DRAFT || 0 },
      ],
    },
    {
      title: "Budgets",
      color: "border-l-green-500",
      bg: "bg-green-50",
      icon: DollarSign,
      iconColor: "text-green-500",
      href: "/accounting/budgets",
      tiles: [
        { label: "Planned", value: `₹${budgetPlanned.toLocaleString()}` },
        { label: "Actual", value: `₹${budgetActual.toLocaleString()}` },
        { label: "Variance", value: `${data?.budgetSummary?.variancePercent || '0.00'}%` },
      ],
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Welcome Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back to Urban Furniture ERP</p>
        </div>
        <div className="text-right text-sm text-gray-400">
          {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </div>
      </div>

      {/* Stat Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map(card => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              onClick={() => router.push(card.href)}
              className={`bg-white rounded-xl border border-gray-200 border-l-4 ${card.color} p-5 cursor-pointer hover:shadow-md transition-shadow`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">{card.title}</div>
                </div>
                <div className={`p-2 rounded-lg ${card.bg}`}>
                  <Icon className={`h-5 w-5 ${card.iconColor}`} />
                </div>
              </div>
              {loading ? (
                <div className="flex gap-4">
                  {[1,2,3].map(i => <div key={i} className="h-8 w-16 bg-gray-100 rounded animate-pulse" />)}
                </div>
              ) : (
                <div className="flex gap-6">
                  {card.tiles.map(tile => (
                    <div key={tile.label}>
                      <div className="text-xl font-bold text-gray-900">{tile.value}</div>
                      <div className="text-xs text-gray-500">{tile.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Monthly Sales Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-gray-800">Monthly Sales (Revenue)</h2>
        </div>
        {loading ? (
          <div className="h-64 w-full bg-gray-50 animate-pulse rounded-lg flex items-center justify-center text-gray-400">Loading chart...</div>
        ) : data?.monthlySales?.length > 0 ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthlySales} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value}`} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <Tooltip 
                  formatter={(value) => [`₹${Number(value).toLocaleString()}`, "Sales"]}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 w-full flex items-center justify-center text-gray-400 border border-dashed border-gray-200 rounded-lg">
            No sales data available for the last 6 months
          </div>
        )}
      </div>

      {/* Quick Access Grid */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4">Quick Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_ACCESS.map(group => (
            <div key={group.label} className={`bg-white rounded-xl border ${group.color} p-4`}>
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${group.iconBg} mb-3`}>
                <span className={`text-xs font-bold uppercase tracking-wide ${group.iconColor}`}>{group.label}</span>
              </div>
              <div className="space-y-1">
                {group.items.map(item => {
                  const ItemIcon = item.icon;
                  return (
                    <div
                      key={item.label}
                      onClick={() => router.push(item.href)}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer text-sm text-gray-700 transition-colors"
                    >
                      <ItemIcon className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                      {item.label}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
