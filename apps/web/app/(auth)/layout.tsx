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
