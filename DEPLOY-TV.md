# Deploy Player to TV Device

Guide for getting the billboard player running full-screen on a TV at **3381 Ocean Front Walk, Mission Beach**.

**Player URL:** `https://mission-beach-billboard-tv.vercel.app/player`

## Option A: Fire TV Stick (Recommended)

### Prerequisites
- Fire TV Stick (any generation) plugged into the TV
- ADB debugging enabled: Settings > My Fire TV > Developer Options > ADB debugging
- Fire TV IP address: Settings > My Fire TV > About > Network
- ADB installed on your machine: `brew install android-platform-tools`

### Setup
```bash
# One-command setup
./scripts/tv-deploy/setup-firetv.sh <fire-tv-ip>

# Or manually:
adb connect <fire-tv-ip>:5555
adb shell am start -a android.intent.action.VIEW \
  -d "https://mission-beach-billboard-tv.vercel.app/player" \
  -n "com.amazon.cloud9/.BrowserActivity"
```

### Remote Management
```bash
adb connect <fire-tv-ip>:5555
adb shell                        # Shell access
adb exec-out screencap -p > ss.png  # Screenshot
adb reboot                       # Reboot device
```

### For Robust Kiosk Mode
Install **Fully Kiosk Browser** ($7.90 one-time) for:
- True kiosk lockdown (no escape to Fire TV UI)
- Auto-restart on crash
- Remote admin web panel
- Motion-activated wake
- Scheduled on/off times

## Option B: Raspberry Pi

### Prerequisites
- Raspberry Pi 3B+ or newer with Raspberry Pi OS
- HDMI cable to TV
- Network connection (WiFi or Ethernet)
- SSH enabled

### Setup
```bash
# SSH into the Pi
ssh pi@<raspberry-pi-ip>

# Run the setup script
curl -sSL <raw-github-url>/scripts/tv-deploy/setup-raspberry-pi.sh | bash

# Or copy the script and run locally
scp scripts/tv-deploy/setup-raspberry-pi.sh pi@<ip>:~/
ssh pi@<ip> "bash ~/setup-raspberry-pi.sh"
```

### Remote Management
```bash
ssh pi@<raspberry-pi-ip>
sudo systemctl status billboard-tv    # Check service
sudo systemctl restart billboard-tv   # Restart player
journalctl -u billboard-tv -f         # Live logs
tail -f ~/billboard-watchdog.log      # Watchdog logs
```

## Health Checks

```bash
# Check deployment + device status
./scripts/tv-deploy/health-check.sh

# With device IP (auto-detects Fire TV vs Pi)
./scripts/tv-deploy/health-check.sh <device-ip>

# Force device type
./scripts/tv-deploy/health-check.sh <device-ip> firetv
./scripts/tv-deploy/health-check.sh <device-ip> rpi

# API health endpoint
curl https://mission-beach-billboard-tv.vercel.app/api/health
```

## Player Features (Kiosk-Optimized)

- **Wake Lock** — prevents screen sleep via Screen Wake Lock API
- **Auto-cursor hide** — cursor disappears after 3s of inactivity
- **Offline indicator** — shows amber "OFFLINE" badge when disconnected
- **Schedule polling** — refreshes ad schedule every 5 minutes
- **Auto-reload** — full page reload every 6 hours to prevent memory leaks
- **Night mode** — auto-dims display between 9 PM and 6 AM

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Black screen | Check HDMI connection, verify player URL loads in normal browser |
| "Restore pages" prompt | Chromium crash flags are auto-cleared by the Pi script |
| Screen goes to sleep | Re-run setup script (disables DPMS and screen blanking) |
| Ads not updating | Check network connection; player polls every 5 min |
| Browser crashed | Watchdog (Pi) auto-restarts within 60s; Fire TV needs manual restart |
| Can't connect via ADB | Verify ADB debugging is ON and device is on same network |
