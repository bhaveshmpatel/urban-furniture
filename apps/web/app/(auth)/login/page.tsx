"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { status, data: session } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      const role = (session?.user as any)?.role;
      if (role === "CONTACT") {
        router.push("/portal");
      } else {
        router.push("/dashboard");
      }
    }
  }, [status, router, session]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const data = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      loginId: data.get("loginId"),
      password: data.get("password"),
      redirect: false,
    });
    setIsLoading(false);
    if (result?.error) {
      setError("Invalid Login Id or Password");
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="bg-uf-surface border border-uf-border rounded-lg p-8 shadow-sm">
      <h2 className="font-serif text-xl font-semibold text-uf-ink mb-1">Sign In</h2>
      <p className="text-sm text-uf-muted mb-6">Enter your credentials to access the system</p>
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-uf-red">{error}</div>}
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-uf-ink mb-1">Login ID</label>
          <input name="loginId" placeholder="e.g. admin001" className="w-full px-3 py-2 text-sm border border-uf-border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-uf-green focus:border-transparent placeholder:text-uf-muted/60" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-uf-ink mb-1">Password</label>
          <input name="password" type="password" placeholder="••••••••" className="w-full px-3 py-2 text-sm border border-uf-border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-uf-green focus:border-transparent placeholder:text-uf-muted/60" required />
        </div>
        <button type="submit" disabled={isLoading} className="w-full py-2.5 px-4 bg-uf-green text-white text-sm font-medium rounded-md hover:bg-[#174a3e] focus:outline-none focus:ring-2 focus:ring-uf-green focus:ring-offset-2 transition-colors disabled:opacity-50">
          {isLoading ? "Signing in…" : "Sign In"}
        </button>
      </form>
      <p className="mt-4 text-center text-xs text-uf-muted">
        New to this system? <Link href="/signup" className="text-uf-green hover:underline">Create an account</Link>
      </p>
    </div>
  );
}
