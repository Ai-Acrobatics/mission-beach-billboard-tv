import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { getSupabase } from "@/lib/supabase";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const supabase = getSupabase();

    const updates: Record<string, unknown> = {};
    if (body.active !== undefined) updates.active = body.active;
    if (body.title !== undefined) updates.title = body.title;
    if (body.priority !== undefined) updates.priority = body.priority;
    if (body.durationSeconds !== undefined)
      updates.duration_seconds = body.durationSeconds;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("ads")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ ad: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update ad";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const supabase = getSupabase();

    // Delete from storage if media exists
    const { data: ad } = await supabase
      .from("ads")
      .select("media_url")
      .eq("id", id)
      .single();

    if (ad?.media_url) {
      const path = extractStoragePath(ad.media_url);
      if (path) {
        await supabase.storage.from("ads").remove([path]);
      }
    }

    const { error } = await supabase.from("ads").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete ad";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function extractStoragePath(url: string): string | null {
  const match = url.match(/\/storage\/v1\/object\/public\/ads\/(.+)/);
  return match ? match[1] : null;
}
