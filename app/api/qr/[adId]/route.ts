import { NextRequest, NextResponse } from "next/server";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * GET /api/qr/[adId]
 * Logs a QR scan event and redirects to the ad's destination URL.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ adId: string }> }
) {
  const { adId } = await params;

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const supabase = getSupabase();

  // Look up the ad's destination URL
  const { data: ad } = await supabase
    .from("ads")
    .select("qr_code_url")
    .eq("id", adId)
    .single();

  const destination = ad?.qr_code_url;

  if (!destination) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Log the scan (fire-and-forget — don't block the redirect)
  const userAgent = req.headers.get("user-agent") ?? null;
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null;

  supabase
    .from("qr_scans")
    .insert({ ad_id: adId, user_agent: userAgent, ip_address: ip })
    .then(() => {});

  return NextResponse.redirect(destination, 302);
}
