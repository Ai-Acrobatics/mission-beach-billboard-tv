import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { getSupabase } from "@/lib/supabase";
import { DEMO_ADS } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("ads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const ads = (data ?? []).map((row: Record<string, unknown>) => ({
      id: row.id,
      clientId: row.client_id || "",
      clientName: row.client_name || "Direct Upload",
      title: row.title,
      mediaUrl: row.media_url,
      mediaType: row.media_type || "video",
      durationSeconds: row.duration_seconds || 15,
      active: row.active ?? true,
      priority: row.priority || "standard",
      qrCodeUrl: row.qr_code_url || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json({ ads });
  } catch {
    // Fallback to demo data if Supabase not configured
    return NextResponse.json({ ads: DEMO_ADS, demo: true });
  }
}

export async function POST(req: NextRequest) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("ads")
      .insert({
        title: body.title,
        client_name: body.clientName || "Direct Upload",
        client_id: body.clientId || null,
        media_url: body.mediaUrl,
        media_type: body.mediaType || "video",
        duration_seconds: body.durationSeconds || 15,
        active: body.active ?? true,
        priority: body.priority || "standard",
        qr_code_url: body.qrCodeUrl || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ ad: data }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create ad";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
