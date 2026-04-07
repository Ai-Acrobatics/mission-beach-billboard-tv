"use client";

import { useState, useEffect, useCallback } from "react";
import { DEMO_ADS } from "@/lib/demo-data";
import { TIME_SLOTS } from "@/lib/constants";
import type { Ad } from "@/lib/types";

interface ImpressionStats {
  total: number;
  totalScans: number;
  byAd: { adId: string; title: string; clientName: string; plays: number; totalSeconds: number; scans: number }[];
  byDay: { date: string; count: number }[];
  byClient: { clientName: string; plays: number; totalSeconds: number }[];
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        active ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-700 text-zinc-400"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-400" : "bg-zinc-500"}`} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: Ad["priority"] }) {
  const colors = {
    takeover: "bg-amber-500/10 text-amber-400",
    premium: "bg-blue-500/10 text-blue-400",
    standard: "bg-zinc-700 text-zinc-400",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[priority]}`}>
      {priority}
    </span>
  );
}

function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1 h-[140px]">
      {data.map((d) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[10px] text-zinc-400">{d.value}</span>
          <div
            className="w-full bg-blue-500 rounded-t"
            style={{ height: `${(d.value / max) * 120}px`, minHeight: d.value > 0 ? 4 : 0 }}
          />
          <span className="text-[10px] text-zinc-500 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function AnalyticsTab() {
  const [stats, setStats] = useState<ImpressionStats | null>(null);
  const [range, setRange] = useState<7 | 30>(7);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/impressions/stats?range=${range}`)
      .then((r) => r.json())
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [range]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <p className="text-zinc-500 py-8 text-center">Loading analytics...</p>;
  }

  if (!stats || stats.total === 0) {
    return (
      <div className="text-center py-12 space-y-2">
        <p className="text-zinc-400">No impressions recorded yet.</p>
        <p className="text-sm text-zinc-600">Impressions are tracked automatically when ads play.</p>
      </div>
    );
  }

  const totalMinutes = stats.byAd.reduce((sum, a) => sum + a.totalSeconds, 0) / 60;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Analytics</h2>
        <div className="flex gap-2">
          {([7, 30] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                range === r ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-white"
              }`}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-zinc-800 p-5">
          <p className="text-sm text-zinc-400">Total Impressions</p>
          <p className="mt-1 text-3xl font-bold">{stats.total.toLocaleString()}</p>
          <p className="text-xs text-zinc-500 mt-1">last {range} days</p>
        </div>
        <div className="rounded-xl border border-zinc-800 p-5">
          <p className="text-sm text-zinc-400">Airtime</p>
          <p className="mt-1 text-3xl font-bold">{totalMinutes.toFixed(1)}<span className="text-lg text-zinc-400"> min</span></p>
          <p className="text-xs text-zinc-500 mt-1">total ad playtime</p>
        </div>
        <div className="rounded-xl border border-zinc-800 p-5">
          <p className="text-sm text-zinc-400">Avg/Day</p>
          <p className="mt-1 text-3xl font-bold">{Math.round(stats.total / range).toLocaleString()}</p>
          <p className="text-xs text-zinc-500 mt-1">impressions per day</p>
        </div>
        <div className="rounded-xl border border-zinc-800 p-5">
          <p className="text-sm text-zinc-400">QR Scans</p>
          <p className="mt-1 text-3xl font-bold">{(stats.totalScans ?? 0).toLocaleString()}</p>
          <p className="text-xs text-zinc-500 mt-1">last {range} days</p>
        </div>
      </div>

      {/* Daily chart */}
      <div className="rounded-xl border border-zinc-800 p-5">
        <h3 className="text-sm font-medium text-zinc-400 mb-4">Impressions by Day</h3>
        <BarChart
          data={stats.byDay.map((d) => ({
            label: new Date(d.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            value: d.count,
          }))}
        />
      </div>

      {/* Per-ad table */}
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <div className="px-4 py-3 bg-zinc-900">
          <h3 className="text-sm font-medium text-zinc-400">Plays by Ad</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-zinc-900/50 text-zinc-500">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Ad</th>
              <th className="text-left px-4 py-2 font-medium">Client</th>
              <th className="text-right px-4 py-2 font-medium">Plays</th>
              <th className="text-right px-4 py-2 font-medium">Airtime</th>
              <th className="text-right px-4 py-2 font-medium">QR Scans</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {stats.byAd.map((row) => (
              <tr key={row.adId} className="hover:bg-zinc-900/50">
                <td className="px-4 py-3 font-medium">{row.title}</td>
                <td className="px-4 py-3 text-zinc-400">{row.clientName}</td>
                <td className="px-4 py-3 text-right">{row.plays.toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-zinc-400">{(row.totalSeconds / 60).toFixed(1)}m</td>
                <td className="px-4 py-3 text-right">{row.scans > 0 ? row.scans.toLocaleString() : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Per-client table */}
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <div className="px-4 py-3 bg-zinc-900">
          <h3 className="text-sm font-medium text-zinc-400">Plays by Client</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-zinc-900/50 text-zinc-500">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Client</th>
              <th className="text-right px-4 py-2 font-medium">Total Plays</th>
              <th className="text-right px-4 py-2 font-medium">Total Airtime</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {stats.byClient.map((row) => (
              <tr key={row.clientName} className="hover:bg-zinc-900/50">
                <td className="px-4 py-3 font-medium">{row.clientName}</td>
                <td className="px-4 py-3 text-right">{row.plays.toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-zinc-400">{(row.totalSeconds / 60).toFixed(1)}m</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [ads, setAds] = useState<Ad[]>(DEMO_ADS);

  useEffect(() => {
    fetch("/api/ads?all=true")
      .then((r) => (r.ok ? r.json() : DEMO_ADS))
      .then(setAds)
      .catch(() => setAds(DEMO_ADS));
  }, []);
  const [activeTab, setActiveTab] = useState<"ads" | "schedule" | "clients" | "analytics">("ads");

  const activeCount = ads.filter((a) => a.active).length;
  const premiumCount = ads.filter((a) => a.priority !== "standard").length;
  const uniqueClients = new Set(ads.map((a) => a.clientId)).size;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold">Admin Dashboard</h1>
          <span className="text-sm text-zinc-500">Mission Beach Billboard TV</span>
        </div>
        <a
          href="/player"
          target="_blank"
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          Open Player &rarr;
        </a>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <div className="rounded-xl border border-zinc-800 p-5">
            <p className="text-sm text-zinc-400">Active Ads</p>
            <p className="mt-1 text-3xl font-bold">{activeCount}</p>
          </div>
          <div className="rounded-xl border border-zinc-800 p-5">
            <p className="text-sm text-zinc-400">Total Ads</p>
            <p className="mt-1 text-3xl font-bold">{ads.length}</p>
          </div>
          <div className="rounded-xl border border-zinc-800 p-5">
            <p className="text-sm text-zinc-400">Premium/Takeover</p>
            <p className="mt-1 text-3xl font-bold">{premiumCount}</p>
          </div>
          <div className="rounded-xl border border-zinc-800 p-5">
            <p className="text-sm text-zinc-400">Clients</p>
            <p className="mt-1 text-3xl font-bold">{uniqueClients}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-zinc-800">
          {(["ads", "schedule", "clients", "analytics"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? "text-white border-b-2 border-blue-500"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Ads Tab */}
        {activeTab === "ads" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Ad Library</h2>
              <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500 transition-colors">
                + Upload Ad
              </button>
            </div>
            <div className="rounded-xl border border-zinc-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-zinc-900 text-zinc-400">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Ad</th>
                    <th className="text-left px-4 py-3 font-medium">Client</th>
                    <th className="text-left px-4 py-3 font-medium">Type</th>
                    <th className="text-left px-4 py-3 font-medium">Duration</th>
                    <th className="text-left px-4 py-3 font-medium">Priority</th>
                    <th className="text-left px-4 py-3 font-medium">QR</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {ads.map((ad) => (
                    <tr key={ad.id} className="hover:bg-zinc-900/50 transition-colors">
                      <td className="px-4 py-3 font-medium">{ad.title}</td>
                      <td className="px-4 py-3 text-zinc-400">{ad.clientName}</td>
                      <td className="px-4 py-3 text-zinc-400 capitalize">{ad.mediaType}</td>
                      <td className="px-4 py-3 text-zinc-400">{ad.durationSeconds}s</td>
                      <td className="px-4 py-3">
                        <PriorityBadge priority={ad.priority} />
                      </td>
                      <td className="px-4 py-3">
                        {ad.qrCodeUrl ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Active
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge active={ad.active} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Schedule Tab */}
        {activeTab === "schedule" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Daily Schedule</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {TIME_SLOTS.map((slot) => {
                const slotAds = ads.filter((a) => a.active);
                return (
                  <div key={slot.id} className="rounded-xl border border-zinc-800 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">{slot.label}</h3>
                      <span className="text-xs text-zinc-500">
                        {slotAds.length} ads
                      </span>
                    </div>
                    <div className="space-y-2">
                      {slotAds.map((ad) => (
                        <div
                          key={ad.id}
                          className="flex items-center justify-between bg-zinc-900 rounded-lg px-3 py-2"
                        >
                          <span className="text-sm">{ad.title}</span>
                          <span className="text-xs text-zinc-500">{ad.durationSeconds}s</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Clients Tab */}
        {activeTab === "clients" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Clients</h2>
              <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500 transition-colors">
                + Add Client
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from(new Set(ads.map((a) => a.clientName))).map((name) => {
                const clientAds = ads.filter((a) => a.clientName === name);
                return (
                  <div key={name} className="rounded-xl border border-zinc-800 p-5">
                    <h3 className="font-medium">{name}</h3>
                    <p className="text-sm text-zinc-400 mt-1">
                      {clientAds.length} ad{clientAds.length !== 1 ? "s" : ""}
                    </p>
                    <div className="mt-3 flex gap-2">
                      {clientAds.map((ad) => (
                        <PriorityBadge key={ad.id} priority={ad.priority} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && <AnalyticsTab />}
      </main>
    </div>
  );
}
