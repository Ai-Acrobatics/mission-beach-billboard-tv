export default function AdminPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-bold">Admin Dashboard</h1>
        <span className="text-sm text-zinc-500">Mission Beach Billboard TV</span>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-zinc-800 p-6">
            <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
              Active Ads
            </h2>
            <p className="mt-2 text-3xl font-bold">0</p>
          </div>
          <div className="rounded-xl border border-zinc-800 p-6">
            <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
              Scheduled
            </h2>
            <p className="mt-2 text-3xl font-bold">0</p>
          </div>
          <div className="rounded-xl border border-zinc-800 p-6">
            <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
              Clients
            </h2>
            <p className="mt-2 text-3xl font-bold">0</p>
          </div>
        </div>

        <div className="mt-12 rounded-xl border border-zinc-800 p-8 text-center">
          <p className="text-zinc-500">
            Ad management coming soon. Connect Supabase to get started.
          </p>
        </div>
      </main>
    </div>
  );
}
