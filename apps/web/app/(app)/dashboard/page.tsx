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
