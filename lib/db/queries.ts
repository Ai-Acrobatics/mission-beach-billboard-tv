import { getSupabase } from "../supabase";
import type { Ad } from "../types";
import type { DbAd } from "./types";

/** Convert a DB row to the app's Ad type */
function toAd(row: DbAd): Ad {
  return {
    id: row.id,
    clientId: row.client_id ?? "",
    clientName: row.client_name,
    title: row.title,
    mediaUrl: row.media_url,
    mediaType: row.media_type,
    durationSeconds: row.duration_seconds,
    active: row.active,
    priority: row.priority,
    qrCodeUrl: row.qr_code_url ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Fetch all active ads from Supabase */
export async function fetchAds(): Promise<Ad[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("ads")
    .select("*")
    .eq("active", true)
    .order("priority", { ascending: true });

  if (error) throw error;
  return (data as DbAd[]).map(toAd);
}

/** Fetch all ads (including inactive) for the admin dashboard */
export async function fetchAllAds(): Promise<Ad[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("ads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as DbAd[]).map(toAd);
}

/** Fetch ads scheduled for a specific time slot and day */
export async function fetchScheduledAds(
  timeSlotId: string,
  dayOfWeek: number
): Promise<Ad[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("schedule_assignments")
    .select("ad_id")
    .eq("time_slot_id", timeSlotId)
    .eq("day_of_week", dayOfWeek)
    .eq("active", true);

  if (error) throw error;
  if (!data || data.length === 0) return [];

  const adIds = data.map((row) => row.ad_id);
  const { data: ads, error: adsError } = await supabase
    .from("ads")
    .select("*")
    .in("id", adIds)
    .eq("active", true);

  if (adsError) throw adsError;
  return (ads as DbAd[]).map(toAd);
}

/** Fetch all clients */
export async function fetchClients() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("business_name");

  if (error) throw error;
  return data;
}
