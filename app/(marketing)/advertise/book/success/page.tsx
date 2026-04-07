import Link from "next/link";

export default function BookingSuccessPage() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="max-w-md text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold">Booking Confirmed!</h1>
        <p className="text-zinc-400 leading-relaxed">
          Your payment was successful. We&apos;ve sent a confirmation email with your booking details.
          Your ad will enter our review queue and go live once approved.
        </p>

        <div className="rounded-xl border border-zinc-800 p-5 text-left space-y-3">
          <h2 className="font-semibold text-sm text-zinc-300">What happens next?</h2>
          <ol className="space-y-2 text-sm text-zinc-400 list-decimal list-inside">
            <li>Our team reviews your booking within 24 hours</li>
            <li>We verify or create your ad creative</li>
            <li>Your ad goes live on the billboard</li>
            <li>You receive a notification when your ad starts running</li>
          </ol>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link
            href="/advertise"
            className="rounded-lg border border-zinc-700 px-6 py-2.5 text-sm font-medium hover:bg-zinc-900 transition-colors"
          >
            Back to Advertise
          </Link>
          <a
            href="mailto:julian@aiacrobatics.com"
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium hover:bg-blue-500 transition-colors"
          >
            Contact Us
          </a>
        </div>
      </div>
    </div>
  );
}
