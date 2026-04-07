import { NextResponse } from "next/server";
import { DEMO_ADS } from "@/lib/demo-data";
import { getAdsForCurrentSlot } from "@/lib/schedule";
import { getSupabase } from "@/lib/supabase";
import { TIME_SLOTS } from "@/lib/constants";
import type { Ad } from "@/lib/types";

export const dynamic = "force-dynamic";

function getCurrentDaypart(): string {
  const hour = new Date().getHours();
  for (const slot of TIME_SLOTS) {
    if (slot.startHour < slot.endHour) {
      if (hour >= slot.startHour && hour < slot.endHour) return slot.id;
    } else {
      // Overnight slot (e.g., 9PM-1AM)
      if (hour >= slot.startHour || hour < slot.endHour) return slot.id;
    }
  }
  return "midday"; // fallback
}

/**
 * GET /api/schedule
 *
 * Returns ads for the current daypart.
 * 1. Check schedule_assignments for the current time slot + day of week
 * 2. If assignments exist, return those ads (takeovers first)
 * 3. If no assignments, return all active ads (fallback)
 * 4. If Supabase not configured, use demo data
 */
export async function GET() {
  const daypart = getCurrentDaypart();
  const dayOfWeek = new Date().getDay(); // 0=Sun

  try {
    const supabase = getSupabase();

    // Check for schedule assignments for this daypart + day
    const { data: assignments, error: assignError } = await supabase
      .from("schedule_assignments")
      .select("ad_id")
      .eq("time_slot_id", daypart)
      .eq("day_of_week", dayOfWeek)
      .eq("active", true);

    let ads: Ad[] = [];

    if (!assignError && assignments && assignments.length > 0) {
      // Fetch the assigned ads
      const adIds = assignments.map(
        (a: { ad_id: string }) => a.ad_id
      );
      const { data: adRows, error: adError } = await supabase
        .from("ads")
        .select("*")
        .in("id", adIds)
        .eq("active", true);

      if (!adError && adRows && adRows.length > 0) {
        ads = mapRows(adRows);
      }
    }

    // If no scheduled ads, fall back to all active ads
    if (ads.length === 0) {
      const { data: allAds, error: allError } = await supabase
        .from("ads")
        .select("*")
        .eq("active", true);

      if (!allError && allAds && allAds.length > 0) {
        ads = mapRows(allAds);
      }
    }

    // Sort: takeover first, then premium, then standard
    const priorityOrder = { takeover: 0, premium: 1, standard: 2 };
    ads.sort(
      (a, b) =>
        priorityOrder[a.priority] - priorityOrder[b.priority]
    );

    // Takeover handling: if any takeover ad exists, only show takeovers
    const takeovers = ads.filter((a) => a.priority === "takeover");
    if (takeovers.length > 0) {
      ads = takeovers;
    }

    // Final fallback to demo data
    if (ads.length === 0) {
      ads = getAdsForCurrentSlot(DEMO_ADS);
    }

    return NextResponse.json({
      ads,
      daypart,
      dayOfWeek,
      refreshIntervalMs: 5 * 60 * 1000,
      generatedAt: new Date().toISOString(),
    });
  } catch {
    // Supabase not configured — use demo data
    const ads = getAdsForCurrentSlot(DEMO_ADS);
    return NextResponse.json({
      ads,
      daypart,
      dayOfWeek,
      refreshIntervalMs: 5 * 60 * 1000,
      generatedAt: new Date().toISOString(),
    });
  }
}

function mapRows(rows: Record<string, unknown>[]): Ad[] {
  return rows.map((row) => ({
    id: row.id as string,
    clientId: (row.client_id as string) || "",
    clientName: (row.client_name as string) || "Unknown",
    title: row.title as string,
    mediaUrl: (row.media_url as string) || "",
    mediaType: (row.media_type as "image" | "video") || "video",
    durationSeconds: (row.duration_seconds as number) || 15,
    active: (row.active as boolean) ?? true,
    priority: (row.priority as Ad["priority"]) || "standard",
    qrCodeUrl: (row.qr_code_url as string) || undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }));
}
