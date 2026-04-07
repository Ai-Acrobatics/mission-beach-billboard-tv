"use client";

import { useState, useEffect, useCallback } from "react";
import { DEMO_ADS } from "@/lib/demo-data";
import { TIME_SLOTS } from "@/lib/constants";
import type { Ad, Client } from "@/lib/types";

interface ImpressionStats {
  total: number;
  totalScans: number;
  byAd: { adId: string; title: string; clientName: string; plays: number; totalSeconds: number; scans: number }[];
  byDay: { date: string; count: number }[];
  byClient: { clientName: string; plays: number; totalSeconds: number }[];
}

interface ClientFormData {
  name: string;
  businessName: string;
  email: string;
  phone: string;
  notes: string;
}

const EMPTY_FORM: ClientFormData = { name: "", businessName: "", email: "", phone: "", notes: "" };

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

function ClientFormModal({
  initial,
  onSave,
  onClose,
  saving,
}: {
  initial: ClientFormData;
  onSave: (data: ClientFormData) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<ClientFormData>(initial);
  const isEdit = initial.name !== "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl">
        <h2 className="text-lg font-semibold mb-4">{isEdit ? "Edit Client" : "Add Client"}</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Contact Name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              placeholder="John Smith"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Business Name *</label>
            <input
              value={form.businessName}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              placeholder="Belmont Park"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                placeholder="john@belmont.com"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                placeholder="(858) 555-0100"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
              placeholder="Internal notes about this client..."
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={!form.name || !form.businessName || saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Client"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ClientsTab({ ads }: { ads: Ad[] }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const loadClients = useCallback(() => {
    setLoading(true);
    fetch("/api/clients")
      .then((r) => r.json())
      .then(setClients)
      .catch(() => setClients([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadClients(); }, [loadClients]);

  const handleSave = async (data: ClientFormData) => {
    setSaving(true);
    try {
      if (editingClient) {
        const res = await fetch(`/api/clients/${editingClient.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Update failed");
      } else {
        const res = await fetch("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Create failed");
      }
      setShowForm(false);
      setEditingClient(null);
      loadClients();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (client: Client) => {
    if (!confirm(`Deactivate ${client.businessName}? Their ads will stop playing.`)) return;
    try {
      await fetch(`/api/clients/${client.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: false }),
      });
      loadClients();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReactivate = async (client: Client) => {
    try {
      await fetch(`/api/clients/${client.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: true }),
      });
      loadClients();
    } catch (err) {
      console.error(err);
    }
  };

  const getClientAds = (clientId: string) => ads.filter((a) => a.clientId === clientId);

  const getClientRevenue = (clientId: string) => {
    const clientAds = getClientAds(clientId);
    // Estimate revenue: premium=$599/wk, takeover=$1499/wk, standard=$299/wk
    const weeklyRates: Record<string, number> = { standard: 299, premium: 599, takeover: 1499 };
    return clientAds
      .filter((a) => a.active)
      .reduce((sum, a) => sum + (weeklyRates[a.priority] || 299), 0);
  };

  const filteredClients = showInactive ? clients : clients.filter((c) => c.active);
  const totalRevenue = filteredClients.reduce((sum, c) => sum + getClientRevenue(c.id), 0);

  if (loading) {
    return <p className="text-zinc-500 py-8 text-center">Loading clients...</p>;
  }

  return (
    <div className="space-y-4">
      {(showForm || editingClient) && (
        <ClientFormModal
          initial={editingClient ? {
            name: editingClient.name,
            businessName: editingClient.businessName,
            email: editingClient.email,
            phone: editingClient.phone,
            notes: editingClient.notes,
          } : EMPTY_FORM}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingClient(null); }}
          saving={saving}
        />
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Clients</h2>
          <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded border-zinc-600"
            />
            Show inactive
          </label>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500 transition-colors"
        >
          + Add Client
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-4">
        <div className="rounded-xl border border-zinc-800 p-5">
          <p className="text-sm text-zinc-400">Active Clients</p>
          <p className="mt-1 text-3xl font-bold">{clients.filter((c) => c.active).length}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 p-5">
          <p className="text-sm text-zinc-400">Total Clients</p>
          <p className="mt-1 text-3xl font-bold">{clients.length}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 p-5">
          <p className="text-sm text-zinc-400">Est. Weekly Revenue</p>
          <p className="mt-1 text-3xl font-bold">${totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      {filteredClients.length === 0 ? (
        <div className="text-center py-12 space-y-2">
          <p className="text-zinc-400">No clients yet.</p>
          <p className="text-sm text-zinc-600">Add your first advertiser to get started.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900 text-zinc-400">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Business</th>
                <th className="text-left px-4 py-3 font-medium">Contact</th>
                <th className="text-right px-4 py-3 font-medium">Active Ads</th>
                <th className="text-right px-4 py-3 font-medium">Est. Weekly</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredClients.map((client) => {
                const clientAds = getClientAds(client.id);
                const activeAds = clientAds.filter((a) => a.active);
                const revenue = getClientRevenue(client.id);
                const isExpanded = expandedId === client.id;

                return (
                  <tr key={client.id} className="group">
                    <td colSpan={6} className="p-0">
                      <div
                        className="grid grid-cols-[1fr_1fr_auto_auto_auto_auto] items-center hover:bg-zinc-900/50 transition-colors cursor-pointer"
                        onClick={() => setExpandedId(isExpanded ? null : client.id)}
                      >
                        <div className="px-4 py-3">
                          <p className="font-medium">{client.businessName}</p>
                          {client.notes && (
                            <p className="text-xs text-zinc-500 mt-0.5 truncate max-w-[200px]">{client.notes}</p>
                          )}
                        </div>
                        <div className="px-4 py-3">
                          <p className="text-zinc-300">{client.name}</p>
                          <p className="text-xs text-zinc-500">{client.email || client.phone || "—"}</p>
                        </div>
                        <div className="px-4 py-3 text-right min-w-[90px]">
                          <span className="font-medium">{activeAds.length}</span>
                          <span className="text-zinc-500">/{clientAds.length}</span>
                        </div>
                        <div className="px-4 py-3 text-right min-w-[110px]">
                          {revenue > 0 ? (
                            <span className="text-emerald-400 font-medium">${revenue.toLocaleString()}</span>
                          ) : (
                            <span className="text-zinc-600">$0</span>
                          )}
                        </div>
                        <div className="px-4 py-3 min-w-[80px]">
                          <StatusBadge active={client.active} />
                        </div>
                        <div className="px-4 py-3 text-right min-w-[120px]">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setEditingClient(client)}
                              className="rounded-lg px-2 py-1 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                            >
                              Edit
                            </button>
                            {client.active ? (
                              <button
                                onClick={() => handleDeactivate(client)}
                                className="rounded-lg px-2 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-colors"
                              >
                                Deactivate
                              </button>
                            ) : (
                              <button
                                onClick={() => handleReactivate(client)}
                                className="rounded-lg px-2 py-1 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/20 transition-colors"
                              >
                                Reactivate
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanded detail row */}
                      {isExpanded && (
                        <div className="px-4 pb-4 bg-zinc-900/30 border-t border-zinc-800/50">
                          <div className="grid gap-4 md:grid-cols-2 pt-3">
                            <div>
                              <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Contact Details</h4>
                              <div className="space-y-1 text-sm">
                                <p><span className="text-zinc-500">Name:</span> {client.name}</p>
                                <p><span className="text-zinc-500">Email:</span> {client.email || "—"}</p>
                                <p><span className="text-zinc-500">Phone:</span> {client.phone || "—"}</p>
                                <p><span className="text-zinc-500">Since:</span> {new Date(client.createdAt).toLocaleDateString()}</p>
                                {client.notes && <p><span className="text-zinc-500">Notes:</span> {client.notes}</p>}
                              </div>
                            </div>
                            <div>
                              <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
                                Booked Slots ({clientAds.length})
                              </h4>
                              {clientAds.length === 0 ? (
                                <p className="text-sm text-zinc-600">No ads assigned yet.</p>
                              ) : (
                                <div className="space-y-1">
                                  {clientAds.map((ad) => (
                                    <div key={ad.id} className="flex items-center justify-between bg-zinc-800/50 rounded-lg px-3 py-2 text-sm">
                                      <div className="flex items-center gap-2">
                                        <StatusBadge active={ad.active} />
                                        <span>{ad.title}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <PriorityBadge priority={ad.priority} />
                                        <span className="text-zinc-500">{ad.durationSeconds}s</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
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
          <ClientsTab ads={ads} />
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && <AnalyticsTab />}
      </main>
    </div>
  );
}
