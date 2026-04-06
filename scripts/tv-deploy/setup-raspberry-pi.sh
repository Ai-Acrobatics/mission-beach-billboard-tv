#!/usr/bin/env bash
# -------------------------------------------------------------------
# Raspberry Pi — Kiosk Setup for Mission Beach Billboard TV
# -------------------------------------------------------------------
# Prerequisites:
#   1. Raspberry Pi with Raspberry Pi OS (Lite or Desktop)
#   2. SSH access enabled
#   3. Connected to network (WiFi or Ethernet)
#   4. HDMI connected to TV
#
# Run this script ON the Raspberry Pi (SSH in first):
#   ssh pi@<raspberry-pi-ip>
#   curl -sSL <this-script-url> | bash
# -------------------------------------------------------------------

set -euo pipefail

PLAYER_URL="${PLAYER_URL:-https://mission-beach-billboard-tv.vercel.app/player}"

echo "=== Mission Beach Billboard TV — Raspberry Pi Kiosk Setup ==="
echo "Player URL: ${PLAYER_URL}"
echo ""

# Update system
echo "[1/7] Updating system packages..."
sudo apt-get update -qq
sudo apt-get upgrade -y -qq

# Install required packages
echo ""
echo "[2/7] Installing Chromium and dependencies..."
sudo apt-get install -y -qq \
  chromium-browser \
  unclutter \
  xdotool \
  xserver-xorg \
  x11-xserver-utils \
  xinit

# Disable screen blanking
echo ""
echo "[3/7] Disabling screen blanking and power management..."
sudo bash -c 'cat > /etc/xdg/lxsession/LXDE-pi/autostart << EOF
@lxpanel --profile LXDE-pi
@pcmanfm --desktop --profile LXDE-pi
@xscreensaver -no-splash
@xset s off
@xset -dpms
@xset s noblank
EOF'

# Create kiosk launch script
echo ""
echo "[4/7] Creating kiosk launch script..."
cat > /home/pi/start-billboard.sh << SCRIPT
#!/bin/bash
# Mission Beach Billboard TV — Kiosk Launcher

export DISPLAY=:0

# Wait for desktop to be ready
sleep 10

# Disable screen blanking
xset s off
xset -dpms
xset s noblank

# Hide cursor after 0.5s of inactivity
unclutter -idle 0.5 -root &

# Remove Chromium crash flags (prevents "restore pages" prompt)
sed -i 's/"exited_cleanly":false/"exited_cleanly":true/' \
  /home/pi/.config/chromium/Default/Preferences 2>/dev/null || true
sed -i 's/"exit_type":"Crashed"/"exit_type":"Normal"/' \
  /home/pi/.config/chromium/Default/Preferences 2>/dev/null || true

# Launch Chromium in kiosk mode
chromium-browser \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --disable-restore-session-state \
  --disable-translate \
  --disable-features=TranslateUI \
  --disable-component-update \
  --autoplay-policy=no-user-gesture-required \
  --check-for-update-interval=31536000 \
  --disable-pinch \
  --overscroll-history-navigation=0 \
  --start-fullscreen \
  --incognito \
  "${PLAYER_URL}"
SCRIPT
chmod +x /home/pi/start-billboard.sh

# Create systemd service for auto-start
echo ""
echo "[5/7] Creating systemd service for auto-start..."
sudo bash -c 'cat > /etc/systemd/system/billboard-tv.service << SERVICE
[Unit]
Description=Mission Beach Billboard TV Kiosk
After=graphical.target
Wants=graphical.target

[Service]
Type=simple
User=pi
Environment=DISPLAY=:0
ExecStartPre=/bin/sleep 15
ExecStart=/home/pi/start-billboard.sh
Restart=on-failure
RestartSec=10

[Install]
WantedBy=graphical.target
SERVICE'

sudo systemctl daemon-reload
sudo systemctl enable billboard-tv.service

# Create watchdog script (restarts browser if it crashes)
echo ""
echo "[6/7] Setting up watchdog..."
cat > /home/pi/billboard-watchdog.sh << 'WATCHDOG'
#!/bin/bash
# Watchdog — restarts Chromium if it's not running

while true; do
  if ! pgrep -x "chromium-browse" > /dev/null; then
    echo "$(date): Chromium not running — restarting..." >> /home/pi/billboard-watchdog.log
    /home/pi/start-billboard.sh &
  fi

  # Health check — verify the player URL is reachable
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${PLAYER_URL}" 2>/dev/null || echo "000")
  if [ "$HTTP_CODE" != "200" ]; then
    echo "$(date): Player URL returned ${HTTP_CODE}" >> /home/pi/billboard-watchdog.log
  fi

  sleep 60
done
WATCHDOG
chmod +x /home/pi/billboard-watchdog.sh

# Add watchdog to crontab
(crontab -l 2>/dev/null; echo "@reboot /home/pi/billboard-watchdog.sh &") | sort -u | crontab -

# Configure overscan (prevent black borders on TV)
echo ""
echo "[7/7] Configuring display output..."
if [ -f /boot/config.txt ]; then
  sudo sed -i 's/#disable_overscan=1/disable_overscan=1/' /boot/config.txt
  # Force HDMI output even without monitor detection
  sudo sed -i 's/#hdmi_force_hotplug=1/hdmi_force_hotplug=1/' /boot/config.txt
fi

echo ""
echo "=== SETUP COMPLETE ==="
echo ""
echo "The billboard player will start automatically on next boot."
echo ""
echo "Commands:"
echo "  Start now:     sudo systemctl start billboard-tv"
echo "  Stop:          sudo systemctl stop billboard-tv"
echo "  Status:        sudo systemctl status billboard-tv"
echo "  Logs:          journalctl -u billboard-tv -f"
echo "  Watchdog log:  tail -f /home/pi/billboard-watchdog.log"
echo ""
echo "Remote access:"
echo "  SSH:           ssh pi@$(hostname -I | awk '{print $1}')"
echo ""
echo "Rebooting in 5 seconds to apply changes..."
sleep 5
sudo reboot
