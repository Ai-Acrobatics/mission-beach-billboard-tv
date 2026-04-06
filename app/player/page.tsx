"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { DEMO_ADS } from "@/lib/demo-data";
import {
  getCurrentTimeSlot,
  getAdsForCurrentSlot,
  isNightMode,
} from "@/lib/schedule";
import {
  DEFAULT_AD_DURATION,
  TRANSITION_DURATION,
  SITE_NAME,
} from "@/lib/constants";
import type { Ad, TimeSlot } from "@/lib/types";

/** How often to re-fetch ad schedule from server (ms) */
const SCHEDULE_POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes

/** Force a full page reload every 6 hours to clear memory leaks */
const HARD_RELOAD_INTERVAL = 6 * 60 * 60 * 1000;

export default function PlayerPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const [nightMode, setNightMode] = useState(false);
  const [timeSlot, setTimeSlot] = useState<TimeSlot | null>(null);
  const [clock, setClock] = useState("");
  const [online, setOnline] = useState(true);
  const bootTime = useRef(Date.now());

  // ---------- Wake Lock (prevent screen sleep) ----------
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;

    async function requestWakeLock() {
      try {
        if ("wakeLock" in navigator) {
          wakeLock = await navigator.wakeLock.request("screen");
        }
      } catch {
        // Wake Lock not supported or failed — acceptable on some devices
      }
    }

    requestWakeLock();

    // Re-acquire on visibility change (e.g. after tab switch)
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        requestWakeLock();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      wakeLock?.release();
    };
  }, []);

  // ---------- Hide cursor after idle (kiosk) ----------
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const hide = () => {
      document.body.style.cursor = "none";
    };
    const show = () => {
      document.body.style.cursor = "default";
      clearTimeout(timer);
      timer = setTimeout(hide, 3000);
    };
    document.addEventListener("mousemove", show);
    timer = setTimeout(hide, 3000);
    return () => {
      document.removeEventListener("mousemove", show);
      clearTimeout(timer);
      document.body.style.cursor = "default";
    };
  }, []);

  // ---------- Online / Offline detection ----------
  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    setOnline(navigator.onLine);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // ---------- Load ads + poll for schedule updates ----------
  const refreshAds = useCallback(() => {
    const filtered = getAdsForCurrentSlot(DEMO_ADS);
    setAds(filtered);
    setNightMode(isNightMode());
    setTimeSlot(getCurrentTimeSlot());
  }, []);

  useEffect(() => {
    refreshAds();
    const poll = setInterval(refreshAds, SCHEDULE_POLL_INTERVAL);
    return () => clearInterval(poll);
  }, [refreshAds]);

  // ---------- Hard reload watchdog ----------
  useEffect(() => {
    const check = setInterval(() => {
      if (Date.now() - bootTime.current > HARD_RELOAD_INTERVAL) {
        window.location.reload();
      }
    }, 60_000);
    return () => clearInterval(check);
  }, []);

  // ---------- Clock ----------
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
      if (now.getSeconds() === 0) {
        setNightMode(isNightMode());
        setTimeSlot(getCurrentTimeSlot());
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  // ---------- Ad rotation ----------
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
    const duration =
      (ads[currentIndex]?.durationSeconds ?? DEFAULT_AD_DURATION) * 1000;
    const timer = setTimeout(advance, duration);
    return () => clearTimeout(timer);
  }, [currentIndex, ads, advance]);

  const currentAd = ads[currentIndex];
  const bgColor = nightMode ? "bg-zinc-950" : "bg-black";
  const brightness = nightMode ? "brightness-75" : "brightness-100";

  // ---------- Empty state ----------
  if (ads.length === 0) {
    return (
      <div
        className={`flex items-center justify-center min-h-screen ${bgColor} text-white select-none`}
      >
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold">{SITE_NAME}</h1>
          <p className="text-xl text-zinc-500">
            No ads scheduled for this time slot
          </p>
          <p className="text-zinc-600">{clock}</p>
          {!online && (
            <p className="text-amber-500 text-sm animate-pulse">
              Offline — waiting for connection
            </p>
          )}
        </div>
      </div>
    );
  }

  // ---------- Main player ----------
  return (
    <div
      className={`relative min-h-screen ${bgColor} text-white overflow-hidden ${brightness} select-none`}
    >
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
            <p className="text-sm text-zinc-400">{timeSlot?.label ?? ""}</p>
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

      {/* Offline indicator */}
      {!online && (
        <div className="absolute top-4 left-4 px-3 py-1 bg-amber-600 rounded text-xs font-semibold animate-pulse">
          OFFLINE
        </div>
      )}

      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-800">
        <div
          className="h-full bg-blue-500 transition-all ease-linear"
          style={{
            animation: `progress ${
              currentAd?.durationSeconds ?? DEFAULT_AD_DURATION
            }s linear forwards`,
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
