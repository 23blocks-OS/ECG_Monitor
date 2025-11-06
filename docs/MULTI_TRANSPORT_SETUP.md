# Multi-Transport Setup Guide

## Overview

This guide explains how to set up and use the ECG Monitor with multiple transport options:
- **WiFi** (direct to AWS - best for home/gym)
- **Bluetooth** (relay via phone - best for outdoor)
- **Cache** (offline storage - automatic fallback)

The system automatically selects the best available transport with seamless fallback.

## Architecture Summary

```
┌────────────────────────────────────────────────────────┐
│ PRIORITY ORDER                                         │
├────────────────────────────────────────────────────────┤
│                                                         │
│  1. WiFi (Priority: 100)                               │
│     └─> Direct to AWS IoT Core                        │
│     └─> Lowest latency (~1-2 seconds)                 │
│     └─> Best for home/gym with known networks         │
│                                                         │
│  2. Bluetooth (Priority: 50)                           │
│     └─> Relay via phone                                │
│     └─> Medium latency (~5-10 seconds)                 │
│     └─> Best for outdoor/portable use                  │
│     └─> Uses phone's cellular data                     │
│                                                         │
│  3. Cache (Priority: 1)                                │
│     └─> Local storage                                  │
│     └─> Sync when connection available                 │
│     └─> Up to 9 days capacity (500 MB)                │
│                                                         │
└────────────────────────────────────────────────────────┘
```

## Prerequisites

### Hardware
- Raspberry Pi Zero 2W (or Pi 4)
- CJMCU-1293 ECG module
- microSD card (16GB+)
- Power supply or battery pack
- Smartphone (iOS 12+ or Android 10+)

### Software
- Raspberry Pi OS (Bullseye or later)
- Python 3.9+
- Bluetooth enabled on Pi and phone

## Installation

### 1. Install Python Dependencies

```bash
cd /home/user/ECG_Monitor

# Install base dependencies
pip3 install -r requirements.txt

# Install Bluetooth libraries (for Bluetooth transport)
sudo apt-get update
sudo apt-get install -y bluetooth bluez libbluetooth-dev
pip3 install bluezero pybluez
```

### 2. Enable Bluetooth on Raspberry Pi

```bash
# Enable Bluetooth service
sudo systemctl enable bluetooth
sudo systemctl start bluetooth

# Check Bluetooth status
sudo systemctl status bluetooth

# Verify Bluetooth adapter
hciconfig
# Should show: hci0 UP RUNNING
```

### 3. Configure the System

Edit the configuration file to enable transports:

```bash
nano config/pi-config.yaml
```

**Add these settings:**

```yaml
# Enable/disable transports
enable_wifi: true       # WiFi to AWS IoT Core
enable_bluetooth: true  # Bluetooth to phone

# Bluetooth settings
bluetooth_device_name: "ECG-Monitor"  # BLE advertising name

# WiFi settings (existing)
aws_iot:
  endpoint: "your-iot-endpoint.iot.us-east-1.amazonaws.com"
  client_id: "ecg-device-001"
  cert_path: "/home/pi/certs/device.crt"
  key_path: "/home/pi/certs/device.key"
  ca_path: "/home/pi/certs/AmazonRootCA1.pem"

# Buffer settings (offline cache)
buffer:
  size_seconds: 30
  enable_disk_cache: true
  cache_directory: "/var/ecg_cache"
  max_cache_size_mb: 500  # ~9 days of data
```

### 4. Create Cache Directory

```bash
sudo mkdir -p /var/ecg_cache
sudo chown pi:pi /var/ecg_cache
sudo chmod 755 /var/ecg_cache
```

### 5. Set Up Bluetooth Permissions

```bash
# Add user to bluetooth group
sudo usermod -a -G bluetooth pi

# Allow Bluetooth without sudo
sudo setcap 'cap_net_raw,cap_net_admin+eip' $(which hciconfig)
sudo setcap 'cap_net_raw,cap_net_admin+eip' $(which hcitool)
```

## Running the Multi-Transport System

### Option 1: Full System (Collection + Multi-Transport Streaming)

```bash
cd pi-streamer
python3 multi_transport_main.py --enable-bluetooth
```

**Command-line options:**
- `--config <path>` - Path to config file (default: ../config/pi-config.yaml)
- `--mock` - Use mock hardware for testing
- `--enable-bluetooth` - Enable Bluetooth transport
- `--disable-wifi` - Disable WiFi (test Bluetooth-only mode)

### Option 2: Testing Different Scenarios

**Test WiFi only (home mode):**
```bash
python3 multi_transport_main.py
# Bluetooth disabled by default, WiFi active
```

**Test Bluetooth only (outdoor mode):**
```bash
python3 multi_transport_main.py --enable-bluetooth --disable-wifi
# Forces Bluetooth-only mode
```

**Test offline mode (no connections):**
```bash
# Disconnect from WiFi
sudo ifconfig wlan0 down

python3 multi_transport_main.py --enable-bluetooth --disable-wifi
# Will cache all data locally
```

## Mobile App Setup

### iOS

1. **Install TestFlight** (for beta testing)
2. **Download ECG Monitor app**
3. **Enable Bluetooth** in Settings
4. **Grant permissions:**
   - Bluetooth
   - Notifications
   - Background processing

### Android

1. **Install APK** (sideload during development)
2. **Enable Bluetooth**
3. **Grant permissions:**
   - Bluetooth
   - Location (required for BLE scanning)
   - Notifications
   - Background processing

### Pairing Process

1. **Start the Pi:**
   ```bash
   python3 multi_transport_main.py --enable-bluetooth
   ```

2. **Open mobile app**
3. **Tap "Scan for Devices"**
4. **Select "ECG-Monitor"** from the list
5. **Confirm pairing** (PIN: 1234 if prompted)
6. **Connection established!**

## Usage Scenarios

### Scenario 1: At Home (WiFi Priority)

```
Setup:
- Pi connected to home WiFi
- Phone paired but app in background

What happens:
✓ Pi uses WiFi to send directly to AWS
✓ Phone not actively used (saves battery)
✓ Lowest latency (~1-2 seconds)
✓ Open app to see real-time data
```

### Scenario 2: Outdoor Running (Bluetooth Priority)

```
Setup:
- Pi has no WiFi available
- Phone paired and connected
- Phone has cellular data

What happens:
✓ Pi sends data via Bluetooth → Phone
✓ Phone relays to AWS via cellular
✓ Medium latency (~5-10 seconds)
✓ View real-time data on phone
✓ Phone caches if cellular drops
```

### Scenario 3: No Connection (Cache)

```
Setup:
- No WiFi available
- Phone not nearby or unpaired
- Pi running standalone

What happens:
✓ Pi caches all data locally (up to 9 days)
✓ Continue recording without interruption
✓ When connection restored:
  - Automatically syncs cached data
  - Cloud processes historical batches
  - Receive delayed analysis
```

### Scenario 4: Transitioning Between Transports

```
Starting at home:
1. Pi connected via WiFi → AWS
   [Sending batch #1 via WiFi]

Walking outside:
2. WiFi connection lost
3. System detects and switches to Bluetooth
   [Batch #2 queued for Bluetooth]

4. Phone receives and relays to AWS
   [Sending batch #2 via Bluetooth → Phone → AWS]

No phone connection:
5. Phone out of range
6. System caches locally
   [Batch #3 cached to disk]

Back home:
7. WiFi reconnects
8. System switches back to WiFi
9. Syncs cached batch #3
   [Sending cached batch #3 via WiFi]
```

## Monitoring and Troubleshooting

### Check System Status

The application prints real-time status every 10 seconds:

```
[14:35:42] Progress:
  Samples: 125000 (250.0 Hz)
  Batches: 50 created, 48 sent
  Runtime: 500.2s

→ Active transport: WIFI (priority: 100)

CONNECTION MANAGER STATUS
═══════════════════════════════════════════════

Active Transport: wifi
Total Batches Sent: 48
Total Bytes Sent: 1,234,567
Transport Switches: 2

Transport Details:

  WIFI:
    Status: connected
    Priority: 100
    Messages: 45
    Bytes: 1,123,456
    Errors: 0

  BLUETOOTH:
    Status: disconnected
    Priority: 50
    Messages: 0
    Bytes: 0
    Errors: 0

  CACHE:
    Status: connected
    Priority: 1
    Messages: 3
    Bytes: 111,111
    Errors: 0

Buffer Status:
  In-memory samples: 7500
  Cached batches: 3
  Cache size: 0.3 MB
```

### Common Issues

#### Bluetooth Won't Connect

**Symptom:** `Bluetooth connection error: No adapter found`

**Solution:**
```bash
# Check if Bluetooth is enabled
sudo systemctl status bluetooth

# Restart Bluetooth service
sudo systemctl restart bluetooth

# Check adapter
hciconfig hci0 up
```

#### Phone Can't Find Pi

**Symptom:** Device not showing in scan

**Solution:**
```bash
# Make sure Pi is advertising
sudo hciconfig hci0 piscan

# Check if advertising
sudo hcitool dev
# Should show: hci0  XX:XX:XX:XX:XX:XX

# Restart multi_transport_main.py with --enable-bluetooth
```

#### WiFi Not Connecting to AWS

**Symptom:** `WiFi transport connection error`

**Solution:**
```bash
# Check network connectivity
ping 8.8.8.8

# Check AWS IoT endpoint
ping your-iot-endpoint.iot.us-east-1.amazonaws.com

# Verify certificates exist
ls -l /home/pi/certs/
# Should show: device.crt, device.key, AmazonRootCA1.pem

# Test with mock mode first
python3 multi_transport_main.py --mock --enable-bluetooth
```

#### Cache Filling Up

**Symptom:** `Cache size: 498.5 MB (near limit)`

**Solution:**
```bash
# Check cache contents
ls -lh /var/ecg_cache/

# Clear old cache manually (if needed)
rm -f /var/ecg_cache/batch_*.json.gz

# Or let system auto-cleanup (removes oldest 20% when full)
```

### Logs and Debugging

**Enable debug logging:**

```bash
# Edit config
nano config/pi-config.yaml

# Change logging level
logging:
  level: "DEBUG"  # Was INFO

# Run with verbose output
python3 multi_transport_main.py --enable-bluetooth 2>&1 | tee ecg_debug.log
```

**Check Bluetooth logs:**
```bash
sudo journalctl -u bluetooth -f
```

**Check system resources:**
```bash
# CPU and memory
htop

# Disk space
df -h

# Check cache directory
du -sh /var/ecg_cache/
```

## Performance Tuning

### Battery Life Optimization

For portable use with battery power:

```yaml
# config/pi-config.yaml

# Reduce WiFi scan frequency
wifi_scan_interval_seconds: 300  # Check every 5 min

# Use lower Bluetooth power
bluetooth_power_level: "low"  # low | medium | high

# Reduce batch frequency (less frequent uploads)
streaming:
  batch_size_seconds: 30  # Was 10, now 30
```

### Data Usage Optimization

To reduce cellular data usage when using phone relay:

```yaml
# Increase compression
streaming:
  compression: true
  compression_algorithm: "gzip"
  compression_level: 9  # Maximum compression

# Larger batches (less overhead)
streaming:
  batch_size_seconds: 30  # Reduces upload frequency
```

## Running as a System Service

To run automatically on boot:

### 1. Create systemd service

```bash
sudo nano /etc/systemd/system/ecg-monitor.service
```

**Content:**
```ini
[Unit]
Description=ECG Monitor Multi-Transport Service
After=network.target bluetooth.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/user/ECG_Monitor/pi-streamer
ExecStart=/usr/bin/python3 /home/user/ECG_Monitor/pi-streamer/multi_transport_main.py --enable-bluetooth
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 2. Enable and start service

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable on boot
sudo systemctl enable ecg-monitor.service

# Start now
sudo systemctl start ecg-monitor.service

# Check status
sudo systemctl status ecg-monitor.service

# View logs
sudo journalctl -u ecg-monitor -f
```

## Security Considerations

### Bluetooth Security

**Pairing modes:**
- Use "Just Works" for convenience (testing)
- Use "Numeric Comparison" for production (secure)

**Enable pairing security:**
```bash
# Set PIN for pairing
sudo bluetoothctl
# > agent on
# > default-agent
# > pairable on
```

### AWS Credentials

**Protect certificates:**
```bash
# Set proper permissions
chmod 600 /home/pi/certs/device.key
chmod 644 /home/pi/certs/device.crt
chmod 644 /home/pi/certs/AmazonRootCA1.pem

# Restrict cache directory
chmod 700 /var/ecg_cache
```

## Testing Checklist

Before deploying:

- [ ] WiFi transport connects to AWS
- [ ] Bluetooth transport pairs with phone
- [ ] Phone app receives data via Bluetooth
- [ ] Phone app uploads to AWS
- [ ] Offline cache stores batches
- [ ] Cached batches sync when online
- [ ] Automatic transport switching works
- [ ] Connection loss/recovery handled
- [ ] Battery life meets requirements
- [ ] Data integrity verified (no sample loss)

## Next Steps

1. **Develop mobile app** (see `design/mobile-app/ARCHITECTURE.md`)
2. **Test outdoor scenarios** (running, cycling)
3. **Optimize battery life** (portable battery pack)
4. **Add GPS tracking** (correlate location with ECG)
5. **Implement local display** (OLED for standalone use)

## Support

For issues or questions:
- Check logs: `sudo journalctl -u ecg-monitor -f`
- GitHub Issues: https://github.com/23blocks-OS/ECG_Monitor/issues
- Documentation: `docs/` directory
