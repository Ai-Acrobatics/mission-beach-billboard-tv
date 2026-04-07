import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { verifyAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/schedule/assignments
 * Returns all schedule assignments. Requires admin auth.
 */
export async function GET() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data, error } = await getSupabase()
      .from("schedule_assignments")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      // Table may not exist yet — return empty array
      console.error("Failed to fetch assignments:", error);
      return NextResponse.json({ assignments: [] });
    }

    return NextResponse.json({ assignments: data });
  } catch {
    return NextResponse.json({ assignments: [] });
  }
}

/**
 * POST /api/schedule/assignments
 * Create or update a schedule assignment.
 * Body: { adId, timeSlotId, dayOfWeek, startDate?, endDate? }
 */
export async function POST(req: NextRequest) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { adId, timeSlotId, dayOfWeek, startDate, endDate } = body;

    if (!adId || !timeSlotId || dayOfWeek === undefined) {
      return NextResponse.json(
        { error: "adId, timeSlotId, and dayOfWeek are required" },
        { status: 400 }
      );
    }

    // Check for conflicts
    const { data: existing } = await getSupabase()
      .from("schedule_assignments")
      .select("*")
      .eq("time_slot_id", timeSlotId)
      .eq("day_of_week", dayOfWeek)
      .neq("ad_id", adId);

    if (existing && existing.length > 0) {
      return NextResponse.json(
        {
          error: "Conflict: this time slot is already assigned",
          conflictingAd: existing[0],
        },
        { status: 409 }
      );
    }

    // Upsert assignment
    const { data, error } = await getSupabase()
      .from("schedule_assignments")
      .upsert(
        {
          ad_id: adId,
          time_slot_id: timeSlotId,
          day_of_week: dayOfWeek,
          start_date: startDate || null,
          end_date: endDate || null,
          active: true,
        },
        { onConflict: "time_slot_id,day_of_week" }
      )
      .select()
      .single();

    if (error) {
      console.error("Failed to save assignment:", error);
      return NextResponse.json(
        { error: "Failed to save assignment" },
        { status: 500 }
      );
    }

    return NextResponse.json({ assignment: data });
  } catch {
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/schedule/assignments
 * Remove an assignment.
 * Body: { timeSlotId, dayOfWeek }
 */
export async function DELETE(req: NextRequest) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { timeSlotId, dayOfWeek } = body;

    if (!timeSlotId || dayOfWeek === undefined) {
      return NextResponse.json(
        { error: "timeSlotId and dayOfWeek are required" },
        { status: 400 }
      );
    }

    const { error } = await getSupabase()
      .from("schedule_assignments")
      .delete()
      .eq("time_slot_id", timeSlotId)
      .eq("day_of_week", dayOfWeek);

    if (error) {
      console.error("Failed to delete assignment:", error);
      return NextResponse.json(
        { error: "Failed to delete assignment" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
