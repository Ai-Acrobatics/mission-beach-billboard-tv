import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * POST /api/impressions
 * Log an ad impression from the player.
 * Body: { adId, durationSeconds, timeSlotId, dayOfWeek }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { adId, durationSeconds, timeSlotId, dayOfWeek } = body;

    if (!adId || !durationSeconds) {
      return NextResponse.json(
        { error: "adId and durationSeconds are required" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { error } = await supabase.from("impressions").insert({
      ad_id: adId,
      duration_seconds: durationSeconds,
      time_slot_id: timeSlotId || null,
      day_of_week: dayOfWeek ?? null,
    });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch {
    // Silently fail — impression tracking should never break the player
    return NextResponse.json({ ok: true });
  }
}
