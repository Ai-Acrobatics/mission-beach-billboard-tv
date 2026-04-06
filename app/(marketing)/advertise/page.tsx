export default function AdvertisePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-zinc-800 px-6 py-4">
        <h1 className="text-xl font-bold tracking-tight">
          Mission Beach Billboard TV
        </h1>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-20 text-center space-y-8">
        <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Advertise on Mission Beach
        </h2>
        <p className="text-lg text-zinc-400 max-w-xl mx-auto">
          Get your business in front of thousands of daily beachgoers with
          our digital billboard TVs located throughout Mission Beach, San Diego.
        </p>

        <div className="grid gap-6 sm:grid-cols-3 mt-12 text-left">
          <div className="rounded-xl border border-zinc-800 p-6">
            <h3 className="font-semibold text-lg">High Visibility</h3>
            <p className="mt-2 text-zinc-400 text-sm">
              Bright, eye-catching displays in high-traffic beach locations.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 p-6">
            <h3 className="font-semibold text-lg">Flexible Scheduling</h3>
            <p className="mt-2 text-zinc-400 text-sm">
              Choose time slots that match your audience — mornings, afternoons,
              or peak hours.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 p-6">
            <h3 className="font-semibold text-lg">Easy Management</h3>
            <p className="mt-2 text-zinc-400 text-sm">
              Upload your ads, set schedules, and track performance from one
              dashboard.
            </p>
          </div>
        </div>

        <div className="mt-12">
          <a
            href="mailto:julian@aiacrobatics.com?subject=Billboard%20TV%20Advertising"
            className="inline-block rounded-lg bg-white text-black px-8 py-3 font-medium hover:bg-zinc-200 transition-colors"
          >
            Get Started
          </a>
        </div>
      </main>

      <footer className="border-t border-zinc-800 px-6 py-4 text-center text-sm text-zinc-500">
        Powered by AI Acrobatics
      </footer>
    </div>
  );
}
