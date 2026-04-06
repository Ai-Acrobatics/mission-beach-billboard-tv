import { PRICING_TIERS, LOCATION } from "@/lib/constants";

export default function AdvertisePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">
          Mission Beach Billboard TV
        </h1>
        <a
          href="mailto:julian@aiacrobatics.com?subject=Billboard%20TV%20Advertising"
          className="rounded-lg bg-white text-black px-4 py-2 text-sm font-medium hover:bg-zinc-200 transition-colors"
        >
          Contact Us
        </a>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center space-y-6">
        <h2 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Advertise on<br />Mission Beach
        </h2>
        <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
          Get your business in front of thousands of daily beachgoers with
          our digital billboard TVs at {LOCATION}.
        </p>
      </section>

      {/* Stats */}
      <section className="border-y border-zinc-800 py-12">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-3xl font-bold">10K+</p>
            <p className="text-sm text-zinc-400 mt-1">Daily foot traffic</p>
          </div>
          <div>
            <p className="text-3xl font-bold">18hrs</p>
            <p className="text-sm text-zinc-400 mt-1">Display time daily</p>
          </div>
          <div>
            <p className="text-3xl font-bold">4</p>
            <p className="text-sm text-zinc-400 mt-1">Time slots</p>
          </div>
          <div>
            <p className="text-3xl font-bold">HD</p>
            <p className="text-sm text-zinc-400 mt-1">Display quality</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <h3 className="text-2xl font-bold text-center mb-10">Why Billboard TV?</h3>
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-800 p-6">
            <h4 className="font-semibold text-lg">High Visibility</h4>
            <p className="mt-2 text-zinc-400 text-sm">
              Bright, eye-catching displays in the highest-traffic beach location
              in San Diego.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 p-6">
            <h4 className="font-semibold text-lg">Flexible Scheduling</h4>
            <p className="mt-2 text-zinc-400 text-sm">
              Choose time slots that match your audience — mornings, midday,
              evenings, or peak hours.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 p-6">
            <h4 className="font-semibold text-lg">QR Interactivity</h4>
            <p className="mt-2 text-zinc-400 text-sm">
              Add scannable QR codes to drive traffic directly to your website,
              menu, or booking page.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <h3 className="text-2xl font-bold text-center mb-10">Pricing</h3>
        <div className="grid gap-6 md:grid-cols-3">
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-xl border p-6 ${
                tier.popular
                  ? "border-blue-500 bg-blue-500/5"
                  : "border-zinc-800"
              }`}
            >
              {tier.popular && (
                <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                  Most Popular
                </span>
              )}
              <h4 className="text-xl font-bold mt-2">{tier.name}</h4>
              <div className="mt-3">
                <span className="text-4xl font-bold">${tier.price}</span>
                <span className="text-zinc-400">{tier.unit}</span>
              </div>
              <ul className="mt-6 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-zinc-300">
                    <span className="text-emerald-400 mt-0.5">&#10003;</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <a
                href={`mailto:julian@aiacrobatics.com?subject=Billboard%20TV%20-%20${encodeURIComponent(tier.name)}%20Plan`}
                className={`mt-6 block text-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  tier.popular
                    ? "bg-blue-600 hover:bg-blue-500 text-white"
                    : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                }`}
              >
                Get Started
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h3 className="text-2xl font-bold mb-4">Ready to reach Mission Beach?</h3>
        <p className="text-zinc-400 mb-8">
          Contact us to reserve your ad slot and start reaching thousands of
          beachgoers today.
        </p>
        <a
          href="mailto:julian@aiacrobatics.com?subject=Billboard%20TV%20Advertising"
          className="inline-block rounded-lg bg-white text-black px-8 py-3 font-medium hover:bg-zinc-200 transition-colors"
        >
          Get in Touch
        </a>
      </section>

      <footer className="border-t border-zinc-800 px-6 py-4 text-center text-sm text-zinc-500">
        Powered by AI Acrobatics
      </footer>
    </div>
  );
}
