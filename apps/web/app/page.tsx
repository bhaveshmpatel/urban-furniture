import Link from "next/link";
import { ArrowRight, BookOpen, Calculator, LineChart, ShieldCheck } from "lucide-react";
import { getServerSession } from "next-auth/next";
import { authConfig } from "@repo/auth";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const session = await getServerSession(authConfig);

  if (session?.user) {
    const role = (session.user as any).role;
    if (role === "CONTACT") {
      redirect("/portal");
    } else {
      redirect("/dashboard");
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-uf-bg text-uf-ink font-sans">
      <header className="flex items-center justify-between px-6 py-4 border-b border-uf-border bg-uf-surface">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-uf-green text-white font-bold font-serif">
            UF
          </div>
          <span className="font-serif text-xl font-semibold tracking-tight text-uf-green">
            Urban Furniture
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-uf-ink hover:text-uf-green transition-colors">
            Log in
          </Link>
          <Link href="/signup" className="rounded-md bg-uf-green px-4 py-2 text-sm font-medium text-white hover:bg-[#174a3e] transition-colors">
            Get Started
          </Link>
        </div>
      </header>
      <main className="flex-1">
        <section className="px-6 py-24 md:py-32 max-w-5xl mx-auto text-center">
          <Badge className="mb-6 inline-flex" />
          <h1 className="font-serif text-5xl md:text-7xl font-bold tracking-tight text-uf-ink mb-6">
            Precision Accounting for <br />
            <span className="text-uf-green">Modern Furniture</span>
          </h1>
          <p className="text-lg md:text-xl text-uf-muted mb-10 max-w-2xl mx-auto">
            A robust, double-entry ledger system designed exclusively for the retail and manufacturing needs of Urban Furniture. Built for scale, accuracy, and speed.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/signup" className="inline-flex h-12 items-center justify-center rounded-md bg-uf-green px-8 text-base font-medium text-white shadow-sm hover:bg-[#174a3e] transition-colors">
              Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link href="/login" className="inline-flex h-12 items-center justify-center rounded-md border border-uf-border bg-white px-8 text-base font-medium shadow-sm hover:bg-gray-50 transition-colors">
              Sign In to Dashboard
            </Link>
          </div>
        </section>
        <section id="features" className="bg-white border-t border-uf-border py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">Enterprise-Grade Financials</h2>
              <p className="text-uf-muted max-w-2xl mx-auto">
                Everything you need to manage your inventory, sales, purchases, and general ledger in one place.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <FeatureCard icon={<BookOpen className="h-6 w-6 text-uf-green" />} title="Double-Entry Ledger" description="Strict adherence to accounting principles ensuring every debit has a matching credit." />
              <FeatureCard icon={<Calculator className="h-6 w-6 text-uf-green" />} title="Automated Posting" description="Invoices and bills automatically post to your journal entries in real-time." />
              <FeatureCard icon={<LineChart className="h-6 w-6 text-uf-green" />} title="Advanced Reporting" description="Generate Trial Balances, P&L, and Balance Sheets with absolute precision." />
              <FeatureCard icon={<ShieldCheck className="h-6 w-6 text-uf-green" />} title="Role-Based Security" description="Secure your financial data with strict accountant and admin role enforcement." />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function Badge({ className }: { className?: string }) {
  return (
    <div className={`inline-flex items-center rounded-full border border-uf-green/20 bg-uf-green-light px-3 py-1 text-sm font-medium text-uf-green ${className}`}>
      <span className="flex h-2 w-2 rounded-full bg-uf-green mr-2"></span>
      Urban Furniture v2.0 Live
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="flex flex-col p-6 rounded-xl border border-uf-border bg-uf-bg hover:shadow-md transition-shadow">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-uf-green-light">
        {icon}
      </div>
      <h3 className="font-semibold text-lg mb-2 text-uf-ink">{title}</h3>
      <p className="text-sm text-uf-muted leading-relaxed">{description}</p>
    </div>
  );
}
