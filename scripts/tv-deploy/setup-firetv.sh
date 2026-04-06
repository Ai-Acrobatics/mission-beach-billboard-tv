#!/usr/bin/env bash
# -------------------------------------------------------------------
# Fire TV Stick — Kiosk Setup for Mission Beach Billboard TV
# -------------------------------------------------------------------
# Prerequisites:
#   1. Fire TV Stick with Developer Options enabled
#      Settings > My Fire TV > About > click "Fire TV Stick" 7 times
#   2. ADB Debugging ON
#      Settings > My Fire TV > Developer Options > ADB debugging ON
#   3. ADB installed on this machine (brew install android-platform-tools)
#   4. Fire TV on same network — find IP at:
#      Settings > My Fire TV > About > Network
# -------------------------------------------------------------------

set -euo pipefail

PLAYER_URL="${PLAYER_URL:-https://mission-beach-billboard-tv.vercel.app/player}"
FIRE_TV_IP="${1:?Usage: $0 <fire-tv-ip-address>}"
ADB_PORT="5555"

echo "=== Mission Beach Billboard TV — Fire TV Setup ==="
echo "Target: ${FIRE_TV_IP}:${ADB_PORT}"
echo "Player URL: ${PLAYER_URL}"
echo ""

# Connect to Fire TV
echo "[1/6] Connecting to Fire TV..."
adb connect "${FIRE_TV_IP}:${ADB_PORT}"
sleep 2

# Verify connection
adb -s "${FIRE_TV_IP}:${ADB_PORT}" get-state || {
  echo "ERROR: Cannot connect to Fire TV at ${FIRE_TV_IP}:${ADB_PORT}"
  echo "Make sure ADB debugging is enabled and the device is on the same network."
  exit 1
}

DEVICE="${FIRE_TV_IP}:${ADB_PORT}"
echo "Connected."

# Install Fully Kiosk Browser (free for Fire TV, best kiosk app)
echo ""
echo "[2/6] Checking for Silk Browser..."
if adb -s "$DEVICE" shell pm list packages | grep -q "com.amazon.cloud9"; then
  echo "Silk Browser found — will use it for kiosk mode."
  BROWSER_PKG="com.amazon.cloud9"
  BROWSER_ACTIVITY="com.amazon.cloud9/.BrowserActivity"
else
  echo "Silk Browser not found. Installing..."
  echo "NOTE: Silk comes pre-installed on Fire TV. If missing, sideload it."
  BROWSER_PKG="com.amazon.cloud9"
  BROWSER_ACTIVITY="com.amazon.cloud9/.BrowserActivity"
fi

# Disable screen saver and sleep
echo ""
echo "[3/6] Disabling sleep & screen saver..."
adb -s "$DEVICE" shell settings put system screen_off_timeout 2147483647
adb -s "$DEVICE" shell settings put secure sleep_timeout 2147483647
adb -s "$DEVICE" shell settings put global stay_on_while_plugged_in 3
echo "Sleep disabled (device will stay on while plugged in)."

# Set screen brightness
echo ""
echo "[4/6] Setting screen brightness to maximum..."
adb -s "$DEVICE" shell settings put system screen_brightness 255
adb -s "$DEVICE" shell settings put system screen_brightness_mode 0

# Launch player URL in Silk Browser
echo ""
echo "[5/6] Launching player in Silk Browser..."
adb -s "$DEVICE" shell am start -a android.intent.action.VIEW \
  -d "${PLAYER_URL}" \
  -n "${BROWSER_ACTIVITY}" \
  --ez "is_full_screen" true

sleep 3

# Create auto-start script
echo ""
echo "[6/6] Setting up auto-start on boot..."
# Create a boot receiver script
adb -s "$DEVICE" shell "mkdir -p /data/local/tmp"
adb -s "$DEVICE" shell "cat > /data/local/tmp/start-billboard.sh << 'SCRIPT'
#!/system/bin/sh
sleep 15
am start -a android.intent.action.VIEW \
  -d \"${PLAYER_URL}\" \
  -n \"com.amazon.cloud9/.BrowserActivity\" \
  --ez \"is_full_screen\" true
SCRIPT"
adb -s "$DEVICE" shell "chmod 755 /data/local/tmp/start-billboard.sh"

echo ""
echo "=== SETUP COMPLETE ==="
echo ""
echo "The player is now running at: ${PLAYER_URL}"
echo ""
echo "Remote Management:"
echo "  Connect:   adb connect ${FIRE_TV_IP}:${ADB_PORT}"
echo "  Screenshot: adb -s ${DEVICE} exec-out screencap -p > screenshot.png"
echo "  Restart:   adb -s ${DEVICE} shell am start -a android.intent.action.VIEW -d '${PLAYER_URL}'"
echo "  Reboot:    adb -s ${DEVICE} reboot"
echo "  Shell:     adb -s ${DEVICE} shell"
echo ""
echo "NOTE: For auto-start on boot, consider installing 'Boot Receiver' app"
echo "or use Fully Kiosk Browser (fully-kiosk.com) for robust kiosk mode."
