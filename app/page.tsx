import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <header className="border-b border-zinc-800 px-6 py-4">
        <h1 className="text-xl font-bold tracking-tight">
          Mission Beach Billboard TV
        </h1>
      </header>

      <main className="flex flex-1 items-center justify-center px-6">
        <div className="max-w-2xl text-center space-y-8">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Digital Signage for Mission Beach
          </h2>
          <p className="text-lg text-zinc-400 max-w-lg mx-auto">
            Manage ad schedules, display content on billboard TVs, and reach
            thousands of beachgoers daily.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/admin"
              className="rounded-lg bg-white text-black px-6 py-3 font-medium hover:bg-zinc-200 transition-colors"
            >
              Admin Dashboard
            </Link>
            <Link
              href="/player"
              className="rounded-lg border border-zinc-700 px-6 py-3 font-medium hover:bg-zinc-900 transition-colors"
            >
              Open Player
            </Link>
            <Link
              href="/advertise"
              className="rounded-lg border border-zinc-700 px-6 py-3 font-medium hover:bg-zinc-900 transition-colors"
            >
              Advertise
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-zinc-800 px-6 py-4 text-center text-sm text-zinc-500">
        Powered by AI Acrobatics
      </footer>
    </div>
  );
}
