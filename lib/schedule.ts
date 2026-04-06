import type { Ad, DayPeriod, TimeSlot } from "./types";
import { TIME_SLOTS } from "./constants";

/**
 * Get the current time slot based on hour of day
 */
export function getCurrentTimeSlot(): TimeSlot | null {
  const hour = new Date().getHours();
  return (
    TIME_SLOTS.find((slot) => {
      if (slot.startHour < slot.endHour) {
        return hour >= slot.startHour && hour < slot.endHour;
      }
      // Handle overnight slots (e.g., 9PM-1AM)
      return hour >= slot.startHour || hour < slot.endHour;
    }) ?? null
  );
}

/**
 * Get day period for theme switching
 */
export function getDayPeriod(): DayPeriod {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 10) return "morning";
  if (hour >= 10 && hour < 16) return "midday";
  if (hour >= 16 && hour < 21) return "evening";
  return "night";
}

/**
 * Check if current time is "night mode" (after sunset / before sunrise)
 */
export function isNightMode(): boolean {
  const period = getDayPeriod();
  return period === "night" || period === "morning";
}

/**
 * Filter ads for the current time slot
 */
export function getAdsForCurrentSlot(ads: Ad[]): Ad[] {
  const activeAds = ads.filter((ad) => ad.active);

  // Sort by priority: takeover > premium > standard
  const priorityOrder = { takeover: 0, premium: 1, standard: 2 };
  return activeAds.sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );
}

/**
 * Get the next ad in the rotation
 */
export function getNextAdIndex(current: number, total: number): number {
  if (total === 0) return 0;
  return (current + 1) % total;
}
