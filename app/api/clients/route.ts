import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { fetchClients, createClient } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

/**
 * GET /api/clients
 * Returns all clients with their ad counts and revenue.
 */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json([]);
  }

  try {
    const clients = await fetchClients();
    return NextResponse.json(clients);
  } catch (err) {
    console.error("Failed to fetch clients:", err);
    return NextResponse.json([], { status: 500 });
  }
}

/**
 * POST /api/clients
 * Create a new client.
 */
export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await req.json();
    const { name, businessName, email, phone, notes } = body;

    if (!name || !businessName) {
      return NextResponse.json(
        { error: "name and businessName are required" },
        { status: 400 }
      );
    }

    const client = await createClient({ name, businessName, email, phone, notes });
    return NextResponse.json(client, { status: 201 });
  } catch (err) {
    console.error("Failed to create client:", err);
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}
