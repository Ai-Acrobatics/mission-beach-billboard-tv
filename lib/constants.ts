import type { TimeSlot, PricingTier } from "./types";

export const SITE_NAME = "Mission Beach Billboard TV";
export const SITE_DESCRIPTION =
  "Digital signage platform for Mission Beach — manage and display ads on billboard TVs";

export const LOCATION = "3381 Ocean Front Walk, Mission Beach, San Diego";

export const TIME_SLOTS: TimeSlot[] = [
  {
    id: "morning",
    name: "Morning",
    startHour: 6,
    endHour: 10,
    label: "Morning (6AM–10AM)",
  },
  {
    id: "midday",
    name: "Midday",
    startHour: 10,
    endHour: 16,
    label: "Midday (10AM–4PM)",
  },
  {
    id: "evening",
    name: "Evening",
    startHour: 16,
    endHour: 21,
    label: "Evening (4PM–9PM)",
  },
  {
    id: "night",
    name: "Night",
    startHour: 21,
    endHour: 1,
    label: "Night (9PM–1AM)",
  },
];

export const PRICING_TIERS: PricingTier[] = [
  {
    name: "Starter",
    price: 299,
    unit: "/week",
    features: [
      "15-second ad slot",
      "1 time slot per day",
      "Basic analytics",
      "Upload your own creative",
    ],
  },
  {
    name: "Growth",
    price: 599,
    unit: "/week",
    popular: true,
    features: [
      "30-second ad slot",
      "2 time slots per day",
      "QR code overlay",
      "Priority placement",
      "Weekly performance report",
    ],
  },
  {
    name: "Takeover",
    price: 1499,
    unit: "/week",
    features: [
      "60-second ad slot",
      "All time slots",
      "Exclusive takeover hours",
      "QR code overlay",
      "Real-time analytics dashboard",
      "Custom creative support",
    ],
  },
];

export const AD_DURATIONS = [15, 30, 60] as const;
export type AdDuration = (typeof AD_DURATIONS)[number];

export const DEFAULT_AD_DURATION = 15; // seconds per ad
export const TRANSITION_DURATION = 1000; // ms fade transition

/** Multipliers for converting weekly price to other durations */
export const DURATION_MULTIPLIERS: Record<string, Record<string, number>> = {
  days: { multiplier: 1 / 7, min: 1 },
  weeks: { multiplier: 1, min: 1 },
  months: { multiplier: 4, min: 1 },
};

export function calculatePrice(
  tierName: string,
  durationValue: number,
  durationUnit: string
): number {
  const tier = PRICING_TIERS.find((t) => t.name === tierName);
  if (!tier) return 0;
  const weeklyPrice = tier.price;
  const mult = DURATION_MULTIPLIERS[durationUnit];
  if (!mult) return 0;
  return Math.round(weeklyPrice * (mult.multiplier as number) * durationValue);
}
