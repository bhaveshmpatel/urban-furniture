"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const data = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(data)),
    });
    setIsLoading(false);
    if (!res.ok) setError("Signup failed");
    else router.push("/login?registered=1");
  };

  return (
    <div className="bg-uf-surface border border-uf-border rounded-lg p-8 shadow-sm">
      <h2 className="font-serif text-xl font-semibold text-uf-ink mb-1">Create Account</h2>
      <p className="text-sm text-uf-muted mb-6">Register as an Accountant to get started</p>
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-uf-red">{error}</div>}
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-uf-ink mb-1">Login ID</label>
          <input name="loginId" placeholder="6–12 alphanumeric characters" className="w-full px-3 py-2 text-sm border border-uf-border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-uf-green focus:border-transparent placeholder:text-uf-muted/60" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-uf-ink mb-1">Email</label>
          <input name="email" type="email" placeholder="you@example.com" className="w-full px-3 py-2 text-sm border border-uf-border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-uf-green focus:border-transparent placeholder:text-uf-muted/60" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-uf-ink mb-1">Password</label>
          <input name="password" type="password" placeholder="Min 9 chars, upper + lower + special" className="w-full px-3 py-2 text-sm border border-uf-border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-uf-green focus:border-transparent placeholder:text-uf-muted/60" required />
        </div>
        <button type="submit" disabled={isLoading} className="w-full py-2.5 px-4 bg-uf-green text-white text-sm font-medium rounded-md hover:bg-[#174a3e] focus:outline-none focus:ring-2 focus:ring-uf-green focus:ring-offset-2 transition-colors disabled:opacity-50">
          {isLoading ? "Creating account…" : "Create Account"}
        </button>
      </form>
      <p className="mt-4 text-center text-xs text-uf-muted">
        Already have an account? <Link href="/login" className="text-uf-green hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
