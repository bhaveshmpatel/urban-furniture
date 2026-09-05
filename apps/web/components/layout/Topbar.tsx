export function Topbar() {
  return (
    <header className="h-16 bg-uf-surface border-b border-uf-border flex items-center justify-between px-6">
      <h2 className="font-semibold text-uf-ink">Dashboard</h2>
      <div className="flex items-center space-x-4">
        <div className="w-8 h-8 bg-uf-green rounded-full flex items-center justify-center text-white">U</div>
      </div>
    </header>
  );
}
