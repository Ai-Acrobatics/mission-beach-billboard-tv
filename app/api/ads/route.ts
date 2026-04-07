import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { fetchAds, fetchAllAds } from "@/lib/db/queries";
import { DEMO_ADS } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

/**
 * GET /api/ads
 * Returns ads from Supabase if configured, otherwise demo data.
 * Query params:
 *   ?all=true — include inactive ads (for admin)
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const showAll = searchParams.get("all") === "true";

  if (!isSupabaseConfigured()) {
    return NextResponse.json(DEMO_ADS);
  }

  try {
    const ads = showAll ? await fetchAllAds() : await fetchAds();
    return NextResponse.json(ads);
  } catch {
    // Fall back to demo data if Supabase query fails
    return NextResponse.json(DEMO_ADS);
  }
}
