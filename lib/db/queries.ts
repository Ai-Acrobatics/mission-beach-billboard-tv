import { getSupabase } from "../supabase";
import type { Ad, Client } from "../types";
import type { DbAd, DbClient, DbBooking } from "./types";

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

/** Convert a DB row to the app's Client type */
function toClient(row: DbClient): Client {
  return {
    id: row.id,
    name: row.name,
    email: row.email ?? "",
    phone: row.phone ?? "",
    businessName: row.business_name,
    notes: row.notes ?? "",
    active: row.active ?? true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Fetch all clients */
export async function fetchClients(): Promise<Client[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("business_name");

  if (error) throw error;
  return (data as DbClient[]).map(toClient);
}

/** Fetch a single client by ID */
export async function fetchClient(id: string): Promise<Client | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return toClient(data as DbClient);
}

/** Create a new client */
export async function createClient(client: {
  name: string;
  businessName: string;
  email?: string;
  phone?: string;
  notes?: string;
}): Promise<Client> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("clients")
    .insert({
      name: client.name,
      business_name: client.businessName,
      email: client.email || null,
      phone: client.phone || null,
      notes: client.notes || null,
    })
    .select()
    .single();

  if (error) throw error;
  return toClient(data as DbClient);
}

/** Update a client */
export async function updateClient(
  id: string,
  updates: {
    name?: string;
    businessName?: string;
    email?: string;
    phone?: string;
    notes?: string;
    active?: boolean;
  }
): Promise<Client> {
  const supabase = getSupabase();
  const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.businessName !== undefined) dbUpdates.business_name = updates.businessName;
  if (updates.email !== undefined) dbUpdates.email = updates.email || null;
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone || null;
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes || null;
  if (updates.active !== undefined) dbUpdates.active = updates.active;

  const { data, error } = await supabase
    .from("clients")
    .update(dbUpdates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return toClient(data as DbClient);
}

/** Deactivate a client and all their ads */
export async function deactivateClient(id: string): Promise<Client> {
  const supabase = getSupabase();

  // Deactivate all ads for this client
  await supabase.from("ads").update({ active: false }).eq("client_id", id);

  // Deactivate the client
  const { data, error } = await supabase
    .from("clients")
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return toClient(data as DbClient);
}

/** Fetch bookings for a specific client */
export async function fetchClientBookings(clientId: string): Promise<DbBooking[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as DbBooking[];
}

/** Fetch all bookings */
export async function fetchAllBookings(): Promise<DbBooking[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as DbBooking[];
}
