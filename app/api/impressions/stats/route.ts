import { NextRequest, NextResponse } from "next/server";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * GET /api/impressions/stats?range=7|30
 * Returns impression counts grouped by ad and by day for the admin dashboard.
 */
export async function GET(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ byAd: [], byDay: [], byClient: [] });
  }

  const range = Number(req.nextUrl.searchParams.get("range") || "7");
  const since = new Date();
  since.setDate(since.getDate() - range);
  const sinceISO = since.toISOString();

  const supabase = getSupabase();

  // Fetch raw impressions joined with ads for the period
  const { data: impressions, error } = await supabase
    .from("impressions")
    .select("id, ad_id, played_at, duration_seconds, time_slot_id, day_of_week")
    .gte("played_at", sinceISO)
    .order("played_at", { ascending: true });

  if (error) {
    return NextResponse.json({ byAd: [], byDay: [], byClient: [], error: error.message }, { status: 500 });
  }

  // Fetch ads for name/client mapping
  const { data: ads } = await supabase.from("ads").select("id, title, client_name, client_id");
  const adMap = new Map((ads ?? []).map((a) => [a.id, a]));

  // Group by ad
  const adCounts = new Map<string, { adId: string; title: string; clientName: string; plays: number; totalSeconds: number }>();
  for (const imp of impressions ?? []) {
    const ad = adMap.get(imp.ad_id);
    const key = imp.ad_id;
    const existing = adCounts.get(key);
    if (existing) {
      existing.plays++;
      existing.totalSeconds += imp.duration_seconds;
    } else {
      adCounts.set(key, {
        adId: key,
        title: ad?.title ?? "Unknown",
        clientName: ad?.client_name ?? "Unknown",
        plays: 1,
        totalSeconds: imp.duration_seconds,
      });
    }
  }

  // Group by day (YYYY-MM-DD)
  const dayCounts = new Map<string, number>();
  for (const imp of impressions ?? []) {
    const day = imp.played_at.slice(0, 10);
    dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1);
  }

  // Group by client
  const clientCounts = new Map<string, { clientName: string; plays: number; totalSeconds: number }>();
  for (const imp of impressions ?? []) {
    const ad = adMap.get(imp.ad_id);
    const name = ad?.client_name ?? "Unknown";
    const existing = clientCounts.get(name);
    if (existing) {
      existing.plays++;
      existing.totalSeconds += imp.duration_seconds;
    } else {
      clientCounts.set(name, { clientName: name, plays: 1, totalSeconds: imp.duration_seconds });
    }
  }

  // Fetch QR scan counts per ad for the same period
  const { data: scans } = await supabase
    .from("qr_scans")
    .select("ad_id, scanned_at")
    .gte("scanned_at", sinceISO);

  const scansByAd = new Map<string, number>();
  let totalScans = 0;
  for (const scan of scans ?? []) {
    scansByAd.set(scan.ad_id, (scansByAd.get(scan.ad_id) ?? 0) + 1);
    totalScans++;
  }

  // Attach scan counts to per-ad stats
  const byAdWithScans = Array.from(adCounts.values())
    .map((row) => ({ ...row, scans: scansByAd.get(row.adId) ?? 0 }))
    .sort((a, b) => b.plays - a.plays);

  return NextResponse.json({
    total: (impressions ?? []).length,
    totalScans,
    byAd: byAdWithScans,
    byDay: Array.from(dayCounts.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    byClient: Array.from(clientCounts.values()).sort((a, b) => b.plays - a.plays),
  });
}
