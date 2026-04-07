#!/usr/bin/env bash
# stream-to-youtube.sh — Captures the billboard player page and streams to YouTube Live
#
# Prerequisites:
#   - Chromium/Chrome installed
#   - ffmpeg installed
#   - PulseAudio or virtual audio sink (for silent audio track)
#   - xvfb (virtual framebuffer) for headless display
#
# Environment variables:
#   YOUTUBE_STREAM_KEY   — YouTube Live stream key (required)
#   YOUTUBE_RTMP_URL     — RTMP ingest URL (default: rtmp://a.rtmp.youtube.com/live2)
#   PLAYER_URL           — Billboard player URL (default: http://localhost:3000/player)
#   DISPLAY_RES          — Capture resolution (default: 1920x1080)
#   STREAM_FPS           — Framerate (default: 30)
#
# Usage:
#   YOUTUBE_STREAM_KEY=xxxx-xxxx-xxxx-xxxx ./scripts/stream-to-youtube.sh

set -euo pipefail

YOUTUBE_STREAM_KEY="${YOUTUBE_STREAM_KEY:?Error: YOUTUBE_STREAM_KEY is required}"
YOUTUBE_RTMP_URL="${YOUTUBE_RTMP_URL:-rtmp://a.rtmp.youtube.com/live2}"
PLAYER_URL="${PLAYER_URL:-http://localhost:3000/player}"
DISPLAY_RES="${DISPLAY_RES:-1920x1080}"
STREAM_FPS="${STREAM_FPS:-30}"
DISPLAY_NUM="${DISPLAY_NUM:-99}"

WIDTH="${DISPLAY_RES%%x*}"
HEIGHT="${DISPLAY_RES##*x}"

cleanup() {
  echo "[stream] Shutting down..."
  kill "$CHROME_PID" 2>/dev/null || true
  kill "$XVFB_PID" 2>/dev/null || true
  exit 0
}
trap cleanup SIGINT SIGTERM EXIT

echo "[stream] Starting virtual framebuffer at :${DISPLAY_NUM} (${DISPLAY_RES})"
Xvfb ":${DISPLAY_NUM}" -screen 0 "${DISPLAY_RES}x24" &
XVFB_PID=$!
sleep 2

export DISPLAY=":${DISPLAY_NUM}"

echo "[stream] Launching Chrome in kiosk mode → ${PLAYER_URL}"
chromium-browser \
  --no-sandbox \
  --disable-gpu \
  --kiosk \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --disable-features=TranslateUI \
  --autoplay-policy=no-user-gesture-required \
  --window-size="${WIDTH},${HEIGHT}" \
  --window-position=0,0 \
  "${PLAYER_URL}" &
CHROME_PID=$!
sleep 5

echo "[stream] Starting ffmpeg → YouTube Live (${STREAM_FPS}fps, ${DISPLAY_RES})"
ffmpeg \
  -loglevel warning \
  -f x11grab \
  -framerate "${STREAM_FPS}" \
  -video_size "${DISPLAY_RES}" \
  -i ":${DISPLAY_NUM}" \
  -f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100 \
  -c:v libx264 \
  -preset veryfast \
  -maxrate 4500k \
  -bufsize 9000k \
  -pix_fmt yuv420p \
  -g "$((STREAM_FPS * 2))" \
  -c:a aac \
  -b:a 128k \
  -ar 44100 \
  -f flv \
  "${YOUTUBE_RTMP_URL}/${YOUTUBE_STREAM_KEY}"
