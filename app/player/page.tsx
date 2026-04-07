"use client";

import { useEffect, useState, useCallback } from "react";
import { DEMO_ADS } from "@/lib/demo-data";
import { getCurrentTimeSlot, getAdsForCurrentSlot, isNightMode } from "@/lib/schedule";
import { DEFAULT_AD_DURATION, TRANSITION_DURATION, SITE_NAME } from "@/lib/constants";
import type { Ad, TimeSlot } from "@/lib/types";

async function loadAds(): Promise<Ad[]> {
  try {
    const res = await fetch("/api/ads", { cache: "no-store" });
    if (res.ok) return res.json();
  } catch {
    // Silently fall back to demo data
  }
  return DEMO_ADS;
}

export default function PlayerPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const [nightMode, setNightMode] = useState(false);
  const [timeSlot, setTimeSlot] = useState<TimeSlot | null>(null);
  const [clock, setClock] = useState("");

  // Load ads from API (falls back to demo data)
  useEffect(() => {
    loadAds().then((allAds) => {
      const filtered = getAdsForCurrentSlot(allAds);
      setAds(filtered);
    });
    setNightMode(isNightMode());
    setTimeSlot(getCurrentTimeSlot());
  }, []);

  // Update clock every second
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      );
      // Check night mode every minute
      if (now.getSeconds() === 0) {
        setNightMode(isNightMode());
        setTimeSlot(getCurrentTimeSlot());
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  // Rotate ads
  const advance = useCallback(() => {
    if (ads.length <= 1) return;
    setFading(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
      setFading(false);
    }, TRANSITION_DURATION);
  }, [ads.length]);

  useEffect(() => {
    if (ads.length === 0) return;
    const duration = (ads[currentIndex]?.durationSeconds ?? DEFAULT_AD_DURATION) * 1000;
    const timer = setTimeout(advance, duration);
    return () => clearTimeout(timer);
  }, [currentIndex, ads, advance]);

  const currentAd = ads[currentIndex];

  // Night mode dims the display
  const bgColor = nightMode ? "bg-zinc-950" : "bg-black";
  const brightness = nightMode ? "brightness-75" : "brightness-100";

  if (ads.length === 0) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${bgColor} text-white`}>
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold">{SITE_NAME}</h1>
          <p className="text-xl text-zinc-500">No ads scheduled for this time slot</p>
          <p className="text-zinc-600">{clock}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative min-h-screen ${bgColor} text-white overflow-hidden ${brightness}`}>
      {/* Full-screen ad display */}
      <div
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-1000 ${
          fading ? "opacity-0" : "opacity-100"
        }`}
      >
        {currentAd?.mediaType === "video" && currentAd.mediaUrl ? (
          <video
            src={currentAd.mediaUrl}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          />
        ) : currentAd?.mediaUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentAd.mediaUrl}
            alt={currentAd.title}
            className="w-full h-full object-cover"
          />
        ) : (
          /* Demo placeholder when no media URL */
          <div className="flex flex-col items-center justify-center w-full h-full bg-gradient-to-br from-blue-900 via-black to-purple-900">
            <p className="text-6xl font-bold mb-4">{currentAd?.clientName}</p>
            <p className="text-3xl text-zinc-300">{currentAd?.title}</p>
            {currentAd?.priority === "premium" && (
              <span className="mt-6 px-4 py-1 bg-amber-500 text-black rounded-full text-sm font-semibold">
                PREMIUM
              </span>
            )}
          </div>
        )}
      </div>

      {/* QR Code overlay */}
      {currentAd?.qrCodeUrl && (
        <div className="absolute bottom-8 right-8 bg-white p-3 rounded-xl shadow-2xl">
          <div className="w-24 h-24 bg-zinc-200 flex items-center justify-center text-zinc-500 text-xs">
            QR
          </div>
          <p className="text-black text-xs text-center mt-1">Scan me</p>
        </div>
      )}

      {/* Bottom info bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-zinc-400">
              {timeSlot?.label ?? ""}
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              Ad {currentIndex + 1} of {ads.length}
              {nightMode && " • Night Mode"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-mono">{clock}</p>
            <p className="text-xs text-zinc-500">{SITE_NAME}</p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-800">
        <div
          className="h-full bg-blue-500 transition-all ease-linear"
          style={{
            animation: `progress ${currentAd?.durationSeconds ?? DEFAULT_AD_DURATION}s linear forwards`,
          }}
        />
      </div>

      <style>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}
