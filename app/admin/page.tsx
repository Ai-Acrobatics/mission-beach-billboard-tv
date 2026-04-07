"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Ad } from "@/lib/types";

// ─── Auth Gate ───────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      onLogin();
    } else {
      const data = await res.json();
      setError(data.error || "Invalid password");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-8"
      >
        <h1 className="text-xl font-bold text-white mb-1">Admin Dashboard</h1>
        <p className="text-sm text-zinc-500 mb-6">Mission Beach Billboard TV</p>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter admin password"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none mb-4"
          autoFocus
        />

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <button
          type="submit"
          disabled={loading || !password}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}

// ─── Upload Modal ────────────────────────────────────────────
function UploadModal({
  onClose,
  onUploaded,
}: {
  onClose: () => void;
  onUploaded: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [priority, setPriority] = useState<"standard" | "premium" | "takeover">(
    "standard"
  );
  const [duration, setDuration] = useState(15);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !title) return;

    setUploading(true);
    setError("");
    setProgress(0);

    try {
      // Step 1: Upload file
      const formData = new FormData();
      formData.append("file", file);

      // Use XMLHttpRequest for progress tracking
      const uploadResult = await new Promise<{
        url: string;
        mediaType: string;
      }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/admin/upload");

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 90));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            const data = JSON.parse(xhr.responseText);
            reject(new Error(data.error || "Upload failed"));
          }
        };

        xhr.onerror = () => reject(new Error("Network error"));
        xhr.send(formData);
      });

      setProgress(95);

      // Step 2: Create ad record
      const res = await fetch("/api/admin/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          clientName: clientName || "Direct Upload",
          mediaUrl: uploadResult.url,
          mediaType: uploadResult.mediaType,
          durationSeconds: duration,
          priority,
          active: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create ad");
      }

      setProgress(100);
      onUploaded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const previewUrl = file ? URL.createObjectURL(file) : null;
  const isVideo = file?.type.startsWith("video/");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">Upload Ad</h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleUpload} className="space-y-4">
          {/* Drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              dragOver
                ? "border-blue-500 bg-blue-500/10"
                : file
                ? "border-emerald-500/50 bg-emerald-500/5"
                : "border-zinc-700 hover:border-zinc-500"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime,image/jpeg,image/png,image/webp"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
            />

            {file ? (
              <div className="space-y-2">
                {previewUrl && isVideo ? (
                  <video
                    src={previewUrl}
                    className="mx-auto max-h-40 rounded-lg"
                    muted
                    autoPlay
                    loop
                    playsInline
                  />
                ) : previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="mx-auto max-h-40 rounded-lg"
                  />
                ) : null}
                <p className="text-sm text-emerald-400">{file.name}</p>
                <p className="text-xs text-zinc-500">
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
            ) : (
              <div>
                <svg
                  className="mx-auto w-10 h-10 text-zinc-500 mb-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="text-sm text-zinc-400">
                  Drop video or image here, or click to browse
                </p>
                <p className="text-xs text-zinc-600 mt-1">
                  MP4, WebM, MOV, JPEG, PNG, WebP — max 100MB
                </p>
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">
              Ad Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Summer Beach Sale — 30% Off"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          {/* Client Name */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">
              Client / Business Name
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. Belmont Park"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Duration & Priority row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                Duration (seconds)
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none"
              >
                <option value={15}>15s</option>
                <option value={30}>30s</option>
                <option value={60}>60s</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) =>
                  setPriority(
                    e.target.value as "standard" | "premium" | "takeover"
                  )
                }
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
                <option value="takeover">Takeover</option>
              </select>
            </div>
          </div>

          {/* Progress bar */}
          {uploading && (
            <div className="space-y-1">
              <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-zinc-500 text-right">{progress}%</p>
            </div>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-zinc-700 px-4 py-2.5 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !file || !title}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
            >
              {uploading ? "Uploading..." : "Upload & Create Ad"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Video Preview Modal ─────────────────────────────────────
function PreviewModal({ ad, onClose }: { ad: Ad; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <div>
            <p className="font-medium text-white">{ad.title}</p>
            <p className="text-sm text-zinc-500">{ad.clientName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="aspect-video bg-black flex items-center justify-center">
          {ad.mediaType === "video" && ad.mediaUrl ? (
            <video
              src={ad.mediaUrl}
              controls
              autoPlay
              className="w-full h-full object-contain"
            />
          ) : ad.mediaUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={ad.mediaUrl}
              alt={ad.title}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-center">
              <p className="text-zinc-500 text-lg">No media file</p>
              <p className="text-zinc-600 text-sm mt-1">Demo ad — no file uploaded</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Status Badge ────────────────────────────────────────────
function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        active
          ? "bg-emerald-500/10 text-emerald-400"
          : "bg-zinc-700 text-zinc-400"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          active ? "bg-emerald-400" : "bg-zinc-500"
        }`}
      />
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
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${colors[priority]}`}
    >
      {priority}
    </span>
  );
}

// ─── Main Admin Dashboard ────────────────────────────────────
export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [ads, setAds] = useState<Ad[]>([]);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [previewAd, setPreviewAd] = useState<Ad | null>(null);
  const [activeTab, setActiveTab] = useState<"ads" | "schedule" | "clients">(
    "ads"
  );
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  const fetchAds = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ads");
      if (res.status === 401) {
        setAuthenticated(false);
        return;
      }
      const data = await res.json();
      setAds(data.ads || []);
      setIsDemo(!!data.demo);
    } catch {
      // Network error
    } finally {
      setLoading(false);
    }
  }, []);

  // Check if already authenticated on mount
  useEffect(() => {
    async function check() {
      try {
        const res = await fetch("/api/admin/ads");
        if (res.ok) {
          setAuthenticated(true);
          const data = await res.json();
          setAds(data.ads || []);
          setIsDemo(!!data.demo);
        }
      } catch {
        // Not authenticated
      } finally {
        setChecking(false);
      }
    }
    check();
  }, []);

  async function toggleActive(id: string, currentActive: boolean) {
    const res = await fetch(`/api/admin/ads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !currentActive }),
    });
    if (res.ok) {
      setAds((prev) =>
        prev.map((ad) =>
          ad.id === id ? { ...ad, active: !currentActive } : ad
        )
      );
    }
  }

  async function deleteAd(id: string) {
    const res = await fetch(`/api/admin/ads/${id}`, { method: "DELETE" });
    if (res.ok) {
      setAds((prev) => prev.filter((ad) => ad.id !== id));
      setDeleteConfirm(null);
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <LoginScreen
        onLogin={() => {
          setAuthenticated(true);
          fetchAds();
        }}
      />
    );
  }

  const filteredAds =
    filter === "all"
      ? ads
      : ads.filter((ad) => (filter === "active" ? ad.active : !ad.active));

  const activeCount = ads.filter((a) => a.active).length;
  const premiumCount = ads.filter(
    (a) => a.priority === "premium" || a.priority === "takeover"
  ).length;
  const uniqueClients = new Set(ads.map((a) => a.clientName)).size;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold">Admin Dashboard</h1>
          <span className="text-sm text-zinc-500">
            Mission Beach Billboard TV
          </span>
          {isDemo && (
            <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full">
              Demo Mode
            </span>
          )}
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
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold">Ad Library</h2>
                <div className="flex gap-1 bg-zinc-800/50 rounded-lg p-0.5">
                  {(["all", "active", "inactive"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-3 py-1 text-xs rounded-md capitalize transition-colors ${
                        filter === f
                          ? "bg-zinc-700 text-white"
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setShowUpload(true)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500 transition-colors"
              >
                + Upload Ad
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredAds.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">
                <p>No ads found</p>
                <button
                  onClick={() => setShowUpload(true)}
                  className="mt-3 text-sm text-blue-400 hover:text-blue-300"
                >
                  Upload your first ad
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-zinc-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-900 text-zinc-400">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium">Ad</th>
                      <th className="text-left px-4 py-3 font-medium">
                        Client
                      </th>
                      <th className="text-left px-4 py-3 font-medium">Type</th>
                      <th className="text-left px-4 py-3 font-medium">
                        Duration
                      </th>
                      <th className="text-left px-4 py-3 font-medium">
                        Priority
                      </th>
                      <th className="text-left px-4 py-3 font-medium">
                        Status
                      </th>
                      <th className="text-right px-4 py-3 font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {filteredAds.map((ad) => (
                      <tr
                        key={ad.id}
                        className="hover:bg-zinc-900/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setPreviewAd(ad)}
                            className="font-medium text-left hover:text-blue-400 transition-colors flex items-center gap-2"
                          >
                            {ad.mediaUrl && (
                              <span className="text-zinc-600">
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                              </span>
                            )}
                            {ad.title}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-zinc-400">
                          {ad.clientName}
                        </td>
                        <td className="px-4 py-3 text-zinc-400 capitalize">
                          {ad.mediaType}
                        </td>
                        <td className="px-4 py-3 text-zinc-400">
                          {ad.durationSeconds}s
                        </td>
                        <td className="px-4 py-3">
                          <PriorityBadge priority={ad.priority} />
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleActive(ad.id, ad.active)}
                            title={
                              ad.active
                                ? "Click to deactivate"
                                : "Click to activate"
                            }
                            disabled={isDemo}
                          >
                            <StatusBadge active={ad.active} />
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setPreviewAd(ad)}
                              className="text-zinc-500 hover:text-white transition-colors p-1"
                              title="Preview"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            </button>
                            {deleteConfirm === ad.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => deleteAd(ad.id)}
                                  className="text-red-400 hover:text-red-300 text-xs font-medium"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(null)}
                                  className="text-zinc-500 hover:text-white text-xs"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirm(ad.id)}
                                className="text-zinc-500 hover:text-red-400 transition-colors p-1"
                                title="Delete"
                                disabled={isDemo}
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Schedule Tab */}
        {activeTab === "schedule" && (
          <div className="text-center py-12 text-zinc-500">
            <p>Schedule management coming soon</p>
            <p className="text-sm mt-1 text-zinc-600">
              Assign ads to time slots and configure rotation
            </p>
          </div>
        )}

        {/* Clients Tab */}
        {activeTab === "clients" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Clients</h2>
            </div>
            {uniqueClients === 0 ? (
              <div className="text-center py-12 text-zinc-500">
                <p>No clients yet</p>
                <p className="text-sm mt-1 text-zinc-600">
                  Clients are created when you upload an ad
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from(new Set(ads.map((a) => a.clientName))).map(
                  (name) => {
                    const clientAds = ads.filter(
                      (a) => a.clientName === name
                    );
                    const activeClientAds = clientAds.filter((a) => a.active);
                    return (
                      <div
                        key={name}
                        className="rounded-xl border border-zinc-800 p-5"
                      >
                        <h3 className="font-medium">{name}</h3>
                        <p className="text-sm text-zinc-400 mt-1">
                          {clientAds.length} ad
                          {clientAds.length !== 1 ? "s" : ""} &middot;{" "}
                          {activeClientAds.length} active
                        </p>
                        <div className="mt-3 flex gap-2 flex-wrap">
                          {clientAds.map((ad) => (
                            <PriorityBadge key={ad.id} priority={ad.priority} />
                          ))}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Upload Modal */}
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onUploaded={() => {
            setShowUpload(false);
            fetchAds();
          }}
        />
      )}

      {/* Preview Modal */}
      {previewAd && (
        <PreviewModal ad={previewAd} onClose={() => setPreviewAd(null)} />
      )}
    </div>
  );
}
