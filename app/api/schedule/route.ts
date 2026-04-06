import { NextResponse } from "next/server";
import { DEMO_ADS } from "@/lib/demo-data";
import { getAdsForCurrentSlot } from "@/lib/schedule";

export const dynamic = "force-dynamic";

/**
 * GET /api/schedule
 *
 * Returns the current ad schedule for the player.
 * Currently uses demo data — swap with Supabase query when DB is ready.
 */
export function GET() {
  const ads = getAdsForCurrentSlot(DEMO_ADS);

  return NextResponse.json({
    ads,
    refreshIntervalMs: 5 * 60 * 1000,
    generatedAt: new Date().toISOString(),
  });
}
