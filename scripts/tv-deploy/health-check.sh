#!/usr/bin/env bash
# -------------------------------------------------------------------
# Remote Health Check for Mission Beach Billboard TV
# -------------------------------------------------------------------
# Run from any machine to verify the player is operational.
# Checks: Vercel deployment, device connectivity, browser status.
# -------------------------------------------------------------------

set -euo pipefail

PLAYER_URL="${PLAYER_URL:-https://mission-beach-billboard-tv.vercel.app/player}"
HEALTH_URL="${HEALTH_URL:-https://mission-beach-billboard-tv.vercel.app/api/health}"
DEVICE_IP="${1:-}"
DEVICE_TYPE="${2:-auto}"  # auto, firetv, rpi

echo "=== Mission Beach Billboard TV — Health Check ==="
echo ""

# 1. Check Vercel deployment
echo "[Vercel] Checking player deployment..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${PLAYER_URL}" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
  echo "[Vercel] Player URL: OK (200)"
else
  echo "[Vercel] Player URL: FAIL (HTTP ${HTTP_CODE})"
fi

# Health endpoint
HEALTH_RESPONSE=$(curl -s "${HEALTH_URL}" 2>/dev/null || echo '{"status":"unreachable"}')
echo "[Vercel] Health API: ${HEALTH_RESPONSE}"
echo ""

# 2. Check device if IP provided
if [ -z "$DEVICE_IP" ]; then
  echo "[Device] No device IP provided. Skipping device checks."
  echo "         Usage: $0 <device-ip> [firetv|rpi]"
  exit 0
fi

echo "[Device] Checking ${DEVICE_IP}..."

# Ping test
if ping -c 1 -W 3 "$DEVICE_IP" > /dev/null 2>&1; then
  echo "[Device] Ping: OK"
else
  echo "[Device] Ping: FAIL (device may be offline)"
  exit 1
fi

# Detect device type
if [ "$DEVICE_TYPE" = "auto" ]; then
  if adb connect "${DEVICE_IP}:5555" 2>/dev/null | grep -q "connected"; then
    DEVICE_TYPE="firetv"
    echo "[Device] Detected: Fire TV Stick"
  elif ssh -o ConnectTimeout=3 -o BatchMode=yes "pi@${DEVICE_IP}" "echo ok" 2>/dev/null; then
    DEVICE_TYPE="rpi"
    echo "[Device] Detected: Raspberry Pi"
  else
    echo "[Device] Could not auto-detect device type."
    DEVICE_TYPE="unknown"
  fi
fi

# Device-specific checks
case "$DEVICE_TYPE" in
  firetv)
    DEVICE="${DEVICE_IP}:5555"
    adb connect "$DEVICE" > /dev/null 2>&1

    # Check if Silk browser is running
    if adb -s "$DEVICE" shell "ps | grep cloud9" 2>/dev/null | grep -q cloud9; then
      echo "[Fire TV] Silk Browser: RUNNING"
    else
      echo "[Fire TV] Silk Browser: NOT RUNNING"
    fi

    # Get screen state
    SCREEN=$(adb -s "$DEVICE" shell "dumpsys power | grep mScreenOn" 2>/dev/null || echo "unknown")
    echo "[Fire TV] Screen: ${SCREEN}"

    # Take screenshot for visual verification
    echo "[Fire TV] Taking screenshot..."
    adb -s "$DEVICE" exec-out screencap -p > "/tmp/billboard-firetv-$(date +%s).png" 2>/dev/null && \
      echo "[Fire TV] Screenshot saved to /tmp/billboard-firetv-*.png" || \
      echo "[Fire TV] Screenshot failed"
    ;;

  rpi)
    echo "[RPi] Checking Chromium status..."
    CHROMIUM_STATUS=$(ssh -o ConnectTimeout=5 "pi@${DEVICE_IP}" "pgrep -x chromium-browse > /dev/null && echo RUNNING || echo STOPPED" 2>/dev/null || echo "SSH_FAILED")
    echo "[RPi] Chromium: ${CHROMIUM_STATUS}"

    # Check systemd service
    SERVICE_STATUS=$(ssh -o ConnectTimeout=5 "pi@${DEVICE_IP}" "systemctl is-active billboard-tv 2>/dev/null || echo inactive" 2>/dev/null || echo "SSH_FAILED")
    echo "[RPi] Service: ${SERVICE_STATUS}"

    # Check uptime
    UPTIME=$(ssh -o ConnectTimeout=5 "pi@${DEVICE_IP}" "uptime -p" 2>/dev/null || echo "unknown")
    echo "[RPi] Uptime: ${UPTIME}"

    # Check watchdog log
    WATCHDOG_TAIL=$(ssh -o ConnectTimeout=5 "pi@${DEVICE_IP}" "tail -3 /home/pi/billboard-watchdog.log 2>/dev/null || echo 'No watchdog log'" 2>/dev/null || echo "SSH_FAILED")
    echo "[RPi] Recent watchdog: ${WATCHDOG_TAIL}"
    ;;

  *)
    echo "[Device] Unknown device type — skipping detailed checks."
    ;;
esac

echo ""
echo "=== Health check complete ==="
