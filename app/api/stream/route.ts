import { NextResponse } from "next/server";

export function GET() {
  const embedUrl = process.env.NEXT_PUBLIC_YOUTUBE_LIVE_EMBED_URL || "";
  const watchUrl = process.env.NEXT_PUBLIC_YOUTUBE_LIVE_WATCH_URL || "";
  const isConfigured = Boolean(embedUrl);

  return NextResponse.json({
    live: isConfigured,
    embedUrl: isConfigured ? embedUrl : null,
    watchUrl: isConfigured ? watchUrl : null,
  });
}
