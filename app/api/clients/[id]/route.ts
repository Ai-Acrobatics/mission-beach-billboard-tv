import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  fetchClient,
  updateClient,
  deactivateClient,
  fetchClientBookings,
} from "@/lib/db/queries";
import { fetchAllAds } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

/**
 * GET /api/clients/[id]
 * Returns a single client with their ads and bookings.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { id } = await params;

  try {
    const client = await fetchClient(id);
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const [allAds, bookings] = await Promise.all([
      fetchAllAds(),
      fetchClientBookings(id),
    ]);

    const clientAds = allAds.filter((ad) => ad.clientId === id);

    return NextResponse.json({ client, ads: clientAds, bookings });
  } catch (err) {
    console.error("Failed to fetch client:", err);
    return NextResponse.json({ error: "Failed to fetch client" }, { status: 500 });
  }
}

/**
 * PATCH /api/clients/[id]
 * Update a client's details or deactivate them.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { id } = await params;

  try {
    const body = await req.json();

    // If deactivating, use the special deactivate function that also stops ads
    if (body.active === false) {
      const client = await deactivateClient(id);
      return NextResponse.json(client);
    }

    const client = await updateClient(id, body);
    return NextResponse.json(client);
  } catch (err) {
    console.error("Failed to update client:", err);
    return NextResponse.json({ error: "Failed to update client" }, { status: 500 });
  }
}
