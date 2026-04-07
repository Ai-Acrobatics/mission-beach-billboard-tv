"use client";

import { useState, useEffect, useCallback } from "react";
import { TIME_SLOTS } from "@/lib/constants";
import type { Ad } from "@/lib/types";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface Assignment {
  ad_id: string;
  time_slot_id: string;
  day_of_week: number;
  active: boolean;
}

interface ScheduleBuilderProps {
  ads: Ad[];
}

export default function ScheduleBuilder({ ads }: ScheduleBuilderProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadAssignments = useCallback(async () => {
    try {
      const res = await fetch("/api/schedule/assignments");
      const data = await res.json();
      if (data.assignments) {
        setAssignments(data.assignments);
      }
    } catch {
      // Silently fail — will use empty state
    }
  }, []);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  function getAssignment(timeSlotId: string, dayOfWeek: number): Assignment | undefined {
    return assignments.find(
      (a) => a.time_slot_id === timeSlotId && a.day_of_week === dayOfWeek
    );
  }

  function getAdForSlot(timeSlotId: string, dayOfWeek: number): Ad | undefined {
    const assignment = getAssignment(timeSlotId, dayOfWeek);
    if (!assignment) return undefined;
    return ads.find((a) => a.id === assignment.ad_id);
  }

  function hasConflict(timeSlotId: string, dayOfWeek: number, adId: string): boolean {
    const existing = getAssignment(timeSlotId, dayOfWeek);
    return !!existing && existing.ad_id !== adId;
  }

  async function assignAd(timeSlotId: string, dayOfWeek: number, adId: string) {
    if (!adId) {
      // Remove assignment
      await removeAssignment(timeSlotId, dayOfWeek);
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/schedule/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adId, timeSlotId, dayOfWeek }),
      });

      const data = await res.json();

      if (res.status === 409) {
        setError(`Conflict: ${data.error}`);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to save");
      }

      // Update local state
      setAssignments((prev) => {
        const filtered = prev.filter(
          (a) => !(a.time_slot_id === timeSlotId && a.day_of_week === dayOfWeek)
        );
        return [...filtered, { ad_id: adId, time_slot_id: timeSlotId, day_of_week: dayOfWeek, active: true }];
      });
      setSuccess("Saved");
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save assignment");
    } finally {
      setSaving(false);
    }
  }

  async function removeAssignment(timeSlotId: string, dayOfWeek: number) {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/schedule/assignments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timeSlotId, dayOfWeek }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to remove");
      }

      setAssignments((prev) =>
        prev.filter(
          (a) => !(a.time_slot_id === timeSlotId && a.day_of_week === dayOfWeek)
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove assignment");
    } finally {
      setSaving(false);
    }
  }

  // Count assignments per slot for summary
  const slotCounts = TIME_SLOTS.map((slot) => ({
    slot,
    count: DAYS.filter((_, i) => getAssignment(slot.id, i)).length,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Schedule Builder</h2>
          <p className="text-sm text-zinc-500 mt-1">
            Assign ads to time slots. Each slot can have one ad per day.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saving && (
            <span className="text-sm text-zinc-400">Saving...</span>
          )}
          {success && (
            <span className="text-sm text-emerald-400">{success}</span>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-300 hover:text-red-200"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Summary row */}
      <div className="grid gap-3 md:grid-cols-4">
        {slotCounts.map(({ slot, count }) => (
          <div key={slot.id} className="rounded-lg border border-zinc-800 p-3">
            <p className="text-sm font-medium">{slot.label}</p>
            <p className="text-xs text-zinc-500 mt-1">
              {count}/7 days assigned
            </p>
          </div>
        ))}
      </div>

      {/* Weekly grid */}
      <div className="rounded-xl border border-zinc-800 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900 text-zinc-400">
            <tr>
              <th className="text-left px-4 py-3 font-medium sticky left-0 bg-zinc-900 z-10 min-w-[140px]">
                Time Slot
              </th>
              {DAYS.map((day) => (
                <th key={day} className="text-center px-3 py-3 font-medium min-w-[130px]">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {TIME_SLOTS.map((slot) => (
              <tr key={slot.id} className="hover:bg-zinc-900/30">
                <td className="px-4 py-3 font-medium sticky left-0 bg-zinc-950 z-10">
                  <div>
                    <p>{slot.name}</p>
                    <p className="text-xs text-zinc-500">{slot.label}</p>
                  </div>
                </td>
                {DAYS.map((_, dayIndex) => {
                  const assignedAd = getAdForSlot(slot.id, dayIndex);
                  return (
                    <td key={dayIndex} className="px-2 py-2">
                      <select
                        value={assignedAd?.id || ""}
                        onChange={(e) => assignAd(slot.id, dayIndex, e.target.value)}
                        disabled={saving}
                        className={`w-full rounded-lg border px-2 py-2 text-xs transition-colors cursor-pointer ${
                          assignedAd
                            ? "border-blue-500/30 bg-blue-500/10 text-white"
                            : "border-zinc-800 bg-zinc-900 text-zinc-500"
                        } focus:border-blue-500 focus:outline-none disabled:opacity-50`}
                      >
                        <option value="">— None —</option>
                        {ads
                          .filter((a) => a.active)
                          .map((ad) => {
                            const conflict = hasConflict(slot.id, dayIndex, ad.id);
                            return (
                              <option key={ad.id} value={ad.id} disabled={conflict}>
                                {ad.clientName}: {ad.title}
                                {conflict ? " (conflict)" : ""}
                              </option>
                            );
                          })}
                      </select>
                      {assignedAd && (
                        <p className="mt-1 text-[10px] text-zinc-500 truncate px-1">
                          {assignedAd.clientName} · {assignedAd.durationSeconds}s ·{" "}
                          <span
                            className={
                              assignedAd.priority === "takeover"
                                ? "text-amber-400"
                                : assignedAd.priority === "premium"
                                ? "text-blue-400"
                                : "text-zinc-500"
                            }
                          >
                            {assignedAd.priority}
                          </span>
                        </p>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-zinc-500">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded border border-blue-500/30 bg-blue-500/10" />
          Assigned
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded border border-zinc-800 bg-zinc-900" />
          Empty
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-amber-400">&#9679;</span> Takeover
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-blue-400">&#9679;</span> Premium
        </div>
      </div>
    </div>
  );
}
