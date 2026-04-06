"use client";

import { useState } from "react";
import { PRICING_TIERS, TIME_SLOTS, calculatePrice } from "@/lib/constants";
import type { DurationUnit } from "@/lib/types";

type Step = "plan" | "details" | "media" | "review";

const STEPS: { key: Step; label: string }[] = [
  { key: "plan", label: "Plan" },
  { key: "details", label: "Details" },
  { key: "media", label: "Ad Creative" },
  { key: "review", label: "Review & Pay" },
];

const DURATION_OPTIONS: { value: DurationUnit; label: string }[] = [
  { value: "days", label: "Days" },
  { value: "weeks", label: "Weeks" },
  { value: "months", label: "Months" },
];

export default function BookPage() {
  const [step, setStep] = useState<Step>("plan");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Plan
  const [selectedTier, setSelectedTier] = useState(PRICING_TIERS[1].name);
  const [timeSlotId, setTimeSlotId] = useState(TIME_SLOTS[1].id);
  const [durationValue, setDurationValue] = useState(1);
  const [durationUnit, setDurationUnit] = useState<DurationUnit>("weeks");

  // Details
  const [businessName, setBusinessName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  // Media
  const [requestAdCreation, setRequestAdCreation] = useState(false);
  const [adNotes, setAdNotes] = useState("");
  // File upload is simulated — in production this would upload to Vercel Blob/S3
  const [adFileName, setAdFileName] = useState<string | null>(null);

  const totalPrice = calculatePrice(selectedTier, durationValue, durationUnit);
  const currentStepIndex = STEPS.findIndex((s) => s.key === step);

  function nextStep() {
    const next = STEPS[currentStepIndex + 1];
    if (next) setStep(next.key);
  }

  function prevStep() {
    const prev = STEPS[currentStepIndex - 1];
    if (prev) setStep(prev.key);
  }

  async function handleCheckout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          contactName,
          contactEmail,
          contactPhone,
          timeSlotId,
          durationValue,
          durationUnit,
          selectedTier,
          requestAdCreation,
          adNotes: adNotes || undefined,
          adFileName: adFileName || undefined,
          totalPrice,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const selectedSlot = TIME_SLOTS.find((s) => s.id === timeSlotId);

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <a href="/advertise" className="text-xl font-bold tracking-tight hover:text-zinc-300 transition-colors">
          Mission Beach Billboard TV
        </a>
        <span className="text-sm text-zinc-500">Book Ad Slot</span>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-10">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0 ${
                  i <= currentStepIndex
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-800 text-zinc-500"
                }`}
              >
                {i + 1}
              </div>
              <span
                className={`text-sm hidden sm:block ${
                  i <= currentStepIndex ? "text-white" : "text-zinc-500"
                }`}
              >
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-px ${
                    i < currentStepIndex ? "bg-blue-600" : "bg-zinc-800"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Step 1: Plan */}
        {step === "plan" && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">Choose Your Plan</h2>
              <p className="text-zinc-400">Select a pricing tier, time slot, and duration.</p>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-zinc-300">Pricing Tier</label>
              <div className="grid gap-3 sm:grid-cols-3">
                {PRICING_TIERS.map((tier) => (
                  <button
                    key={tier.name}
                    onClick={() => setSelectedTier(tier.name)}
                    className={`rounded-xl border p-4 text-left transition-colors ${
                      selectedTier === tier.name
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-zinc-800 hover:border-zinc-600"
                    }`}
                  >
                    <p className="font-semibold">{tier.name}</p>
                    <p className="text-sm text-zinc-400 mt-1">
                      ${tier.price}{tier.unit}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-zinc-300">Time Slot</label>
              <div className="grid gap-3 sm:grid-cols-2">
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot.id}
                    onClick={() => setTimeSlotId(slot.id)}
                    className={`rounded-xl border p-4 text-left transition-colors ${
                      timeSlotId === slot.id
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-zinc-800 hover:border-zinc-600"
                    }`}
                  >
                    <p className="font-medium">{slot.label}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Duration</label>
                <input
                  type="number"
                  min={1}
                  max={52}
                  value={durationValue}
                  onChange={(e) => setDurationValue(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Unit</label>
                <select
                  value={durationUnit}
                  onChange={(e) => setDurationUnit(e.target.value as DurationUnit)}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none"
                >
                  {DURATION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 flex items-center justify-between">
              <span className="text-zinc-400">Estimated Total</span>
              <span className="text-2xl font-bold">${totalPrice}</span>
            </div>

            <div className="flex justify-end">
              <button
                onClick={nextStep}
                className="rounded-lg bg-blue-600 px-6 py-2.5 font-medium hover:bg-blue-500 transition-colors"
              >
                Next: Your Details
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Details */}
        {step === "details" && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">Business Details</h2>
              <p className="text-zinc-400">Tell us about your business so we can set up your ad.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Business Name *</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Acme Surf Shop"
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-white placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Contact Name *</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-white placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Email *</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="jane@acmesurf.com"
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-white placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Phone</label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="(858) 555-1234"
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-white placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={prevStep}
                className="rounded-lg border border-zinc-700 px-6 py-2.5 font-medium hover:bg-zinc-900 transition-colors"
              >
                Back
              </button>
              <button
                onClick={nextStep}
                disabled={!businessName || !contactName || !contactEmail}
                className="rounded-lg bg-blue-600 px-6 py-2.5 font-medium hover:bg-blue-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next: Ad Creative
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Media */}
        {step === "media" && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">Ad Creative</h2>
              <p className="text-zinc-400">Upload your ad video or request our team to create one for you.</p>
            </div>

            <div className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  onClick={() => setRequestAdCreation(false)}
                  className={`rounded-xl border p-5 text-left transition-colors ${
                    !requestAdCreation
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-zinc-800 hover:border-zinc-600"
                  }`}
                >
                  <p className="font-semibold">Upload My Ad</p>
                  <p className="text-sm text-zinc-400 mt-1">I have a video/image ready to go</p>
                </button>
                <button
                  onClick={() => setRequestAdCreation(true)}
                  className={`rounded-xl border p-5 text-left transition-colors ${
                    requestAdCreation
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-zinc-800 hover:border-zinc-600"
                  }`}
                >
                  <p className="font-semibold">Create My Ad</p>
                  <p className="text-sm text-zinc-400 mt-1">Our team will design it for you</p>
                </button>
              </div>

              {!requestAdCreation && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">Upload Ad (video or image)</label>
                  <div className="rounded-xl border-2 border-dashed border-zinc-700 p-8 text-center">
                    <input
                      type="file"
                      accept="video/*,image/*"
                      onChange={(e) => setAdFileName(e.target.files?.[0]?.name ?? null)}
                      className="hidden"
                      id="ad-upload"
                    />
                    <label htmlFor="ad-upload" className="cursor-pointer">
                      {adFileName ? (
                        <p className="text-emerald-400 font-medium">{adFileName}</p>
                      ) : (
                        <>
                          <p className="text-zinc-400">Click to upload or drag and drop</p>
                          <p className="text-xs text-zinc-600 mt-1">MP4, MOV, PNG, JPG up to 100MB</p>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">
                  {requestAdCreation ? "Describe your ad (brand, message, style)" : "Notes (optional)"}
                </label>
                <textarea
                  value={adNotes}
                  onChange={(e) => setAdNotes(e.target.value)}
                  rows={4}
                  placeholder={
                    requestAdCreation
                      ? "Tell us about your brand, what message you want to convey, colors, style preferences..."
                      : "Any special instructions for your ad placement..."
                  }
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-white placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={prevStep}
                className="rounded-lg border border-zinc-700 px-6 py-2.5 font-medium hover:bg-zinc-900 transition-colors"
              >
                Back
              </button>
              <button
                onClick={nextStep}
                className="rounded-lg bg-blue-600 px-6 py-2.5 font-medium hover:bg-blue-500 transition-colors"
              >
                Next: Review
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === "review" && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">Review & Pay</h2>
              <p className="text-zinc-400">Confirm your booking details and proceed to payment.</p>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-zinc-800 divide-y divide-zinc-800">
                <div className="px-4 py-3 flex justify-between">
                  <span className="text-zinc-400">Plan</span>
                  <span className="font-medium">{selectedTier}</span>
                </div>
                <div className="px-4 py-3 flex justify-between">
                  <span className="text-zinc-400">Time Slot</span>
                  <span className="font-medium">{selectedSlot?.label}</span>
                </div>
                <div className="px-4 py-3 flex justify-between">
                  <span className="text-zinc-400">Duration</span>
                  <span className="font-medium">{durationValue} {durationUnit}</span>
                </div>
                <div className="px-4 py-3 flex justify-between">
                  <span className="text-zinc-400">Business</span>
                  <span className="font-medium">{businessName}</span>
                </div>
                <div className="px-4 py-3 flex justify-between">
                  <span className="text-zinc-400">Contact</span>
                  <span className="font-medium">{contactName} ({contactEmail})</span>
                </div>
                <div className="px-4 py-3 flex justify-between">
                  <span className="text-zinc-400">Ad Creative</span>
                  <span className="font-medium">
                    {requestAdCreation ? "We'll create it" : adFileName || "Not uploaded"}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 flex items-center justify-between">
                <span className="text-lg font-medium">Total</span>
                <span className="text-3xl font-bold">${totalPrice}</span>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={prevStep}
                className="rounded-lg border border-zinc-700 px-6 py-2.5 font-medium hover:bg-zinc-900 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleCheckout}
                disabled={loading}
                className="rounded-lg bg-emerald-600 px-8 py-2.5 font-medium hover:bg-emerald-500 transition-colors disabled:opacity-50"
              >
                {loading ? "Redirecting..." : `Pay $${totalPrice}`}
              </button>
            </div>

            <p className="text-xs text-zinc-600 text-center">
              You&apos;ll be redirected to Stripe for secure payment. Your ad will enter review after payment.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
