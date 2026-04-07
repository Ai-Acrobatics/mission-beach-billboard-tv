"use client";

import { useState } from "react";
import { DEMO_ADS } from "@/lib/demo-data";
import type { Ad } from "@/lib/types";
import ScheduleBuilder from "@/components/ScheduleBuilder";

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

export default function AdminPage() {
  const [ads] = useState<Ad[]>(DEMO_ADS);
  const [activeTab, setActiveTab] = useState<"ads" | "schedule" | "clients">("ads");

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
          {(["ads", "schedule", "clients"] as const).map((tab) => (
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
          <ScheduleBuilder ads={ads} />
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
      </main>
    </div>
  );
}
