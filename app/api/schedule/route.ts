import { NextResponse } from "next/server";
import { DEMO_ADS } from "@/lib/demo-data";
import { getAdsForCurrentSlot } from "@/lib/schedule";
import { getSupabase } from "@/lib/supabase";
import type { Ad } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/schedule
 *
 * Returns the current ad schedule for the player.
 * Uses Supabase when configured, falls back to demo data.
 */
export async function GET() {
  let ads: Ad[];

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("ads")
      .select("*")
      .eq("active", true)
      .order("priority", { ascending: true });

    if (error) throw error;

    if (data && data.length > 0) {
      ads = data.map((row: Record<string, unknown>) => ({
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
    } else {
      ads = getAdsForCurrentSlot(DEMO_ADS);
    }
  } catch {
    // Supabase not configured — use demo data
    ads = getAdsForCurrentSlot(DEMO_ADS);
  }

  return NextResponse.json({
    ads,
    refreshIntervalMs: 5 * 60 * 1000,
    generatedAt: new Date().toISOString(),
  });
}
