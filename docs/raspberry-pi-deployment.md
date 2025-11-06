# Raspberry Pi Deployment Guide

Complete guide to deploying and running the ECG Monitor software on your Raspberry Pi with CJMCU-1293 hardware.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Hardware Setup](#hardware-setup)
3. [Operating System Setup](#operating-system-setup)
4. [AWS IoT Core Certificate Setup](#aws-iot-core-certificate-setup)
5. [Software Installation](#software-installation)
6. [Configuration](#configuration)
7. [Running the Services](#running-the-services)
8. [Systemd Service Setup (Auto-Start)](#systemd-service-setup-auto-start)
9. [Testing and Verification](#testing-and-verification)
10. [Troubleshooting](#troubleshooting)
11. [Monitoring and Maintenance](#monitoring-and-maintenance)
12. [Updating the Software](#updating-the-software)

---

## Prerequisites

### Hardware Requirements

- **Raspberry Pi**: Model 3B+ or 4 (recommended: Pi 4 with 2GB+ RAM)
- **CJMCU-1293 Module**: ADS1293 3-channel ECG AFE
- **ECG Electrodes**: 3 disposable or reusable electrodes
- **Power Supply**: 5V 3A USB-C (Pi 4) or micro-USB (Pi 3)
- **SD Card**: 16GB+ Class 10 (32GB recommended)
- **Internet Connection**: WiFi or Ethernet

### Software Requirements

- **Operating System**: Raspberry Pi OS (64-bit recommended)
- **Python**: 3.9 or higher
- **Git**: For cloning the repository
- **AWS Account**: With IoT Core access

### Skills Required

- Basic Linux command line knowledge
- Ability to SSH into Raspberry Pi
- Understanding of file editing (nano/vim)

---

## Hardware Setup

### CJMCU-1293 to Raspberry Pi Connections

The CJMCU-1293 communicates with the Raspberry Pi via SPI interface.

#### Pin Connections

| CJMCU-1293 Pin | Raspberry Pi Pin | Function |
|----------------|------------------|----------|
| VCC | Pin 1 (3.3V) | Power |
| GND | Pin 6 (GND) | Ground |
| SCLK | Pin 23 (GPIO 11 / SCLK) | SPI Clock |
| MISO | Pin 21 (GPIO 9 / MISO) | SPI Master In Slave Out |
| MOSI | Pin 19 (GPIO 10 / MOSI) | SPI Master Out Slave In |
| CS | Pin 24 (GPIO 8 / CE0) | SPI Chip Select |
| DRDY | Pin 13 (GPIO 27) | Data Ready (interrupt) |
| RESET | Pin 11 (GPIO 17) | Hardware Reset |

#### Electrode Placement

For basic 3-lead ECG monitoring:

- **Lead I (Channel 1)**: Left Arm (LA) to Right Arm (RA)
- **Lead II (Channel 2)**: Left Leg (LL) to Right Arm (RA)
- **Lead III (Channel 3)**: Left Leg (LL) to Left Arm (LA)

**Standard placement:**
- Right Arm (RA): Below right collarbone
- Left Arm (LA): Below left collarbone
- Left Leg (LL): Lower left ribcage

**Safety Notes:**
- This is for personal health monitoring only, not medical diagnosis
- Keep device away from AC power sources
- Do not use while bathing or swimming
- Do not use if you have an implanted pacemaker without doctor approval

---

## Operating System Setup

### 1. Install Raspberry Pi OS

**Option A: Using Raspberry Pi Imager (Recommended)**

1. Download [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
2. Insert SD card into your computer
3. Open Imager and select:
   - OS: Raspberry Pi OS (64-bit)
   - Storage: Your SD card
4. Click Settings (gear icon):
   - Enable SSH
   - Set username/password (e.g., `pi` / `yourpassword`)
   - Configure WiFi (optional)
5. Write to SD card

**Option B: Manual Installation**

1. Download [Raspberry Pi OS](https://www.raspberrypi.com/software/operating-systems/)
2. Flash to SD card using balenaEtcher
3. Enable SSH by creating empty file `ssh` in boot partition
4. Configure WiFi (optional): Create `wpa_supplicant.conf` in boot partition

### 2. Initial Boot and Connection

1. Insert SD card into Raspberry Pi
2. Connect power supply
3. Wait 1-2 minutes for boot
4. Find Pi's IP address:
   ```bash
   # From your computer (same network)
   ping raspberrypi.local
   # Or check your router's DHCP list
   ```

5. SSH into the Pi:
   ```bash
   ssh pi@raspberrypi.local
   # Or: ssh pi@<ip-address>
   ```

### 3. System Configuration

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Enable SPI interface
sudo raspi-config
# Navigate to: Interface Options > SPI > Enable

# Install system dependencies
sudo apt install -y python3-pip python3-dev git

# Install SPI and GPIO libraries
sudo apt install -y python3-spidev python3-rpi.gpio

# Reboot to apply SPI settings
sudo reboot
```

### 4. Create Directory Structure

```bash
# Create application directories
sudo mkdir -p /opt/ecg_monitor
sudo mkdir -p /var/ecg_cache
sudo mkdir -p /var/log/ecg_monitor
sudo mkdir -p /home/pi/certs

# Set ownership
sudo chown -R pi:pi /opt/ecg_monitor
sudo chown -R pi:pi /var/ecg_cache
sudo chown -R pi:pi /var/log/ecg_monitor
sudo chown -R pi:pi /home/pi/certs
```

---

## AWS IoT Core Certificate Setup

Your Raspberry Pi needs X.509 certificates to authenticate with AWS IoT Core.

### Method 1: Generate Certificates via AWS Console (Recommended)

1. **Login to AWS Console** → Navigate to **IoT Core**

2. **Go to Manage > Things** → Find your device (e.g., `ecg-device-001`)

3. **Create Certificate**:
   - Click on the Thing → Security → Create certificate
   - Download all 3 files:
     - `xxxxxxxxxx-certificate.pem.crt` → Rename to `device.crt`
     - `xxxxxxxxxx-private.pem.key` → Rename to `device.key`
     - `AmazonRootCA1.pem` (download from Amazon)

4. **Activate the certificate** in the AWS console

5. **Attach the policy** to the certificate (should be auto-attached by Terraform)

### Method 2: Use Terraform Output

If you deployed using Terraform with certificate creation:

```bash
# On your development machine (where you ran Terraform)
cd terraform/environments/poc

# Get certificate ARN
terraform output iot_certificate_arn

# If Terraform saved the certificate files
terraform output -raw device_certificate > device.crt
terraform output -raw device_private_key > device.key
```

### Transfer Certificates to Raspberry Pi

**From your computer:**

```bash
# SCP the certificates to Pi
scp device.crt device.key pi@raspberrypi.local:/home/pi/certs/

# Download Amazon Root CA1
ssh pi@raspberrypi.local
cd /home/pi/certs
wget https://www.amazontrust.com/repository/AmazonRootCA1.pem

# Secure the certificates
chmod 644 /home/pi/certs/device.crt
chmod 644 /home/pi/certs/AmazonRootCA1.pem
chmod 600 /home/pi/certs/device.key  # Private key should be read-only
```

### Verify Certificate Files

```bash
ls -lh /home/pi/certs/
# Should show:
# -rw-r--r-- device.crt
# -rw------- device.key
# -rw-r--r-- AmazonRootCA1.pem
```

---

## Software Installation

### 1. Clone the Repository

```bash
cd /opt/ecg_monitor
git clone https://github.com/yourusername/ECG_Monitor.git .
# Or transfer files via SCP if repository is private
```

**Alternative: Transfer via SCP**

```bash
# From your development machine
cd /path/to/ECG_Monitor
tar czf ecg_monitor.tar.gz pi-collector/ pi-streamer/ config/
scp ecg_monitor.tar.gz pi@raspberrypi.local:/tmp/

# On Raspberry Pi
cd /opt/ecg_monitor
tar xzf /tmp/ecg_monitor.tar.gz
```

### 2. Install Python Dependencies

```bash
cd /opt/ecg_monitor

# Install collector dependencies
cd pi-collector
pip3 install -r requirements.txt

# Install streamer dependencies
cd ../pi-streamer
pip3 install -r requirements.txt
```

**Expected dependencies:**

**pi-collector/requirements.txt:**
- spidev (SPI communication)
- RPi.GPIO (GPIO control)
- numpy (signal processing)
- scipy (filtering)
- PyYAML (configuration)

**pi-streamer/requirements.txt:**
- AWSIoTPythonSDK (MQTT client)
- PyYAML (configuration)

### 3. Verify Installation

```bash
# Check Python packages
pip3 list | grep -E "spidev|RPi.GPIO|numpy|scipy|AWSIoT"

# Test SPI interface
ls -l /dev/spidev*
# Should show: /dev/spidev0.0 and /dev/spidev0.1
```

---

## Configuration

### 1. Copy Configuration Template

```bash
cd /opt/ecg_monitor
cp config/pi-config.yaml pi-config.yaml
```

### 2. Edit Configuration

```bash
nano pi-config.yaml
```

**Required changes:**

```yaml
# AWS IoT Core Connection
aws_iot:
  endpoint: "YOUR_IOT_ENDPOINT.iot.us-east-1.amazonaws.com"  # ← CHANGE THIS
  client_id: "ecg-device-001"  # ← Must match your Thing name
  topic_prefix: "ecg/device001"
  cert_path: "/home/pi/certs/device.crt"
  key_path: "/home/pi/certs/device.key"
  ca_path: "/home/pi/certs/AmazonRootCA1.pem"
```

**Get your IoT endpoint:**

```bash
# From your development machine
aws iot describe-endpoint --endpoint-type iot:Data-ATS

# Output example: a3qjexample123-ats.iot.us-east-1.amazonaws.com
```

**Optional changes:**

```yaml
# If using 50 Hz power (Europe/Asia)
processing:
  notch_frequency_hz: 50  # Change from 60 to 50

# Adjust sampling rate if needed
ecg:
  sampling_rate_hz: 250  # Can be 125, 250, 500

# Logging level for debugging
logging:
  level: "DEBUG"  # For troubleshooting (change back to INFO later)
```

### 3. Validate Configuration

```bash
# Test YAML syntax
python3 -c "import yaml; yaml.safe_load(open('pi-config.yaml'))"
# No output = success

# Verify certificate paths exist
cat pi-config.yaml | grep -E "cert_path|key_path|ca_path" | while read line; do
    path=$(echo $line | cut -d'"' -f2)
    if [ -f "$path" ]; then
        echo "✓ $path exists"
    else
        echo "✗ $path NOT FOUND"
    fi
done
```

---

## Running the Services

### Option 1: Manual Testing (Recommended First)

Start each component manually to verify everything works.

#### Start the Collector

```bash
cd /opt/ecg_monitor/pi-collector
python3 main.py --config ../pi-config.yaml
```

**Expected output:**
```
INFO: Starting ECG Collector...
INFO: Hardware: CJMCU-1293 (ADS1293)
INFO: Sampling rate: 250 Hz, Channels: 3
INFO: Initializing SPI interface (bus=0, device=0)
INFO: Configuring ADS1293 registers...
INFO: ECG acquisition started
INFO: Buffer: 0.0/30.0 seconds
```

**If you see errors:** See [Troubleshooting](#troubleshooting) section

#### Start the Streamer (in another SSH session)

```bash
# Open second SSH session
ssh pi@raspberrypi.local

cd /opt/ecg_monitor/pi-streamer
python3 main.py --config ../pi-config.yaml
```

**Expected output:**
```
INFO: Starting ECG Streamer...
INFO: Connecting to AWS IoT Core...
INFO: Endpoint: a3qjexample-ats.iot.us-east-1.amazonaws.com
INFO: Client ID: ecg-device-001
INFO: Connected successfully
INFO: Waiting for batches in /var/ecg_cache...
INFO: Published batch 1 (2.5 KB compressed)
```

**Monitor both terminals** to see data flow:
- Collector: Writing batches to cache
- Streamer: Publishing batches to IoT

#### Test with Mock Mode (No Hardware)

If you don't have the hardware connected yet:

```bash
# Run collector in mock mode
cd /opt/ecg_monitor/pi-collector
python3 main.py --config ../pi-config.yaml --mock

# Mock mode generates simulated ECG data
```

### Option 2: Background Execution

```bash
# Run collector in background
cd /opt/ecg_monitor/pi-collector
nohup python3 main.py --config ../pi-config.yaml > /var/log/ecg_monitor/collector.log 2>&1 &
echo $! > /tmp/collector.pid

# Run streamer in background
cd /opt/ecg_monitor/pi-streamer
nohup python3 main.py --config ../pi-config.yaml > /var/log/ecg_monitor/streamer.log 2>&1 &
echo $! > /tmp/streamer.pid

# Check processes
ps aux | grep python3 | grep ecg

# View logs
tail -f /var/log/ecg_monitor/collector.log
tail -f /var/log/ecg_monitor/streamer.log

# Stop services
kill $(cat /tmp/collector.pid)
kill $(cat /tmp/streamer.pid)
```

---

## Systemd Service Setup (Auto-Start)

Set up systemd services to auto-start on boot and restart on failure.

### 1. Create Collector Service

```bash
sudo nano /etc/systemd/system/ecg-collector.service
```

**Content:**

```ini
[Unit]
Description=ECG Monitor Data Collector
After=network.target
Wants=network-online.target

[Service]
Type=simple
User=pi
Group=pi
WorkingDirectory=/opt/ecg_monitor/pi-collector
ExecStart=/usr/bin/python3 /opt/ecg_monitor/pi-collector/main.py --config /opt/ecg_monitor/pi-config.yaml
Restart=always
RestartSec=10
StandardOutput=append:/var/log/ecg_monitor/collector.log
StandardError=append:/var/log/ecg_monitor/collector.log

# Resource limits
MemoryMax=256M
CPUQuota=50%

[Install]
WantedBy=multi-user.target
```

### 2. Create Streamer Service

```bash
sudo nano /etc/systemd/system/ecg-streamer.service
```

**Content:**

```ini
[Unit]
Description=ECG Monitor Cloud Streamer
After=network-online.target ecg-collector.service
Wants=network-online.target
Requires=ecg-collector.service

[Service]
Type=simple
User=pi
Group=pi
WorkingDirectory=/opt/ecg_monitor/pi-streamer
ExecStart=/usr/bin/python3 /opt/ecg_monitor/pi-streamer/main.py --config /opt/ecg_monitor/pi-config.yaml
Restart=always
RestartSec=10
StandardOutput=append:/var/log/ecg_monitor/streamer.log
StandardError=append:/var/log/ecg_monitor/streamer.log

# Resource limits
MemoryMax=256M
CPUQuota=30%

[Install]
WantedBy=multi-user.target
```

### 3. Enable and Start Services

```bash
# Reload systemd to recognize new services
sudo systemctl daemon-reload

# Enable auto-start on boot
sudo systemctl enable ecg-collector.service
sudo systemctl enable ecg-streamer.service

# Start services now
sudo systemctl start ecg-collector.service
sudo systemctl start ecg-streamer.service

# Check status
sudo systemctl status ecg-collector.service
sudo systemctl status ecg-streamer.service
```

### 4. Service Management Commands

```bash
# View logs
sudo journalctl -u ecg-collector.service -f
sudo journalctl -u ecg-streamer.service -f

# Restart services
sudo systemctl restart ecg-collector.service
sudo systemctl restart ecg-streamer.service

# Stop services
sudo systemctl stop ecg-collector.service
sudo systemctl stop ecg-streamer.service

# Disable auto-start
sudo systemctl disable ecg-collector.service
sudo systemctl disable ecg-streamer.service

# View recent errors
sudo journalctl -u ecg-collector.service --since "10 minutes ago"
```

---

## Testing and Verification

### 1. Verify Data Collection

```bash
# Check if batches are being created
ls -lh /var/ecg_cache/
# Should see .json.gz files

# Check cache statistics
du -sh /var/ecg_cache/
# Should show increasing size

# View a batch (decompress first)
gunzip -c /var/ecg_cache/batch_*.json.gz | head -50
```

### 2. Verify Cloud Streaming

**From AWS Console:**

1. Go to **IoT Core > Test > MQTT test client**
2. Subscribe to topic: `ecg/device001/data`
3. Should see messages every 10 seconds

**From AWS CLI:**

```bash
# Check IoT activity
aws iot describe-thing --thing-name ecg-device-001

# Check S3 for received data
aws s3 ls s3://YOUR_BUCKET/raw-data/device_id=ecg-device-001/
# Should see dated partitions with .json.gz files
```

### 3. Check System Resources

```bash
# CPU and memory usage
top -p $(pgrep -f "ecg_monitor")

# Disk usage
df -h /var/ecg_cache

# Network activity
sudo iftop -i wlan0  # Or eth0 for Ethernet
```

### 4. End-to-End Test

```bash
# 1. Generate a test pattern by tapping electrodes
# 2. Wait 30 seconds for data to buffer
# 3. Check collector logs
tail -20 /var/log/ecg_monitor/collector.log

# 4. Check streamer logs
tail -20 /var/log/ecg_monitor/streamer.log

# 5. Check AWS S3
aws s3 ls s3://YOUR_BUCKET/raw-data/device_id=ecg-device-001/ --recursive --human-readable | tail

# 6. Check web dashboard
# Open: https://YOUR_CLOUDFRONT_URL
# Should show recent data
```

---

## Troubleshooting

### SPI Interface Issues

**Problem:** `FileNotFoundError: [Errno 2] No such file or directory: '/dev/spidev0.0'`

**Solution:**
```bash
# Enable SPI
sudo raspi-config
# Interface Options > SPI > Yes

# Verify SPI is enabled
lsmod | grep spi
# Should show: spi_bcm2835

# Reboot
sudo reboot
```

### GPIO Permission Issues

**Problem:** `RuntimeError: No access to /dev/mem`

**Solution:**
```bash
# Add user to gpio group
sudo usermod -aG gpio pi

# Logout and login again
exit
ssh pi@raspberrypi.local

# Verify group membership
groups
# Should include: gpio
```

### AWS IoT Connection Failures

**Problem:** `Connection refused` or `SSL: CERTIFICATE_VERIFY_FAILED`

**Solutions:**

```bash
# 1. Verify certificate files exist and have correct permissions
ls -l /home/pi/certs/
chmod 600 /home/pi/certs/device.key

# 2. Test endpoint connectivity
ping YOUR_IOT_ENDPOINT.iot.us-east-1.amazonaws.com

# 3. Verify certificate with OpenSSL
openssl s_client -connect YOUR_IOT_ENDPOINT.iot.us-east-1.amazonaws.com:8883 \
  -CAfile /home/pi/certs/AmazonRootCA1.pem \
  -cert /home/pi/certs/device.crt \
  -key /home/pi/certs/device.key

# Should see: "Verify return code: 0 (ok)"

# 4. Check IoT Core policy
aws iot list-attached-policies --target YOUR_CERTIFICATE_ARN
```

**Problem:** `Not authorized to perform iot:Publish`

**Solution:**
```bash
# Update IoT policy to allow publish
aws iot get-policy --policy-name YOUR_POLICY_NAME

# Policy should include:
# {
#   "Effect": "Allow",
#   "Action": "iot:Publish",
#   "Resource": "arn:aws:iot:REGION:ACCOUNT:topic/ecg/device001/*"
# }
```

### No ECG Signal

**Problem:** Flat line or noisy signal in logs

**Solutions:**

1. **Check electrode placement:**
   - Electrodes should have good skin contact
   - Clean skin with alcohol wipe
   - Use conductive gel if available

2. **Verify hardware connections:**
   ```bash
   # Check SPI communication
   sudo apt install python3-spidev
   python3 << EOF
   import spidev
   spi = spidev.SpiDev()
   spi.open(0, 0)
   print("SPI opened successfully")
   spi.close()
   EOF
   ```

3. **Test in mock mode:**
   ```bash
   # This verifies software is working
   python3 /opt/ecg_monitor/pi-collector/main.py --config /opt/ecg_monitor/pi-config.yaml --mock
   ```

4. **Check DRDY pin:**
   ```bash
   # Monitor Data Ready pin
   gpio -g mode 27 in
   gpio -g read 27
   # Should toggle between 0 and 1
   ```

### High CPU Usage

**Problem:** Python process using >80% CPU

**Solutions:**

1. **Check sampling rate:**
   ```yaml
   # In pi-config.yaml
   ecg:
     sampling_rate_hz: 250  # Lower to 125 if needed
   ```

2. **Disable filters temporarily:**
   ```yaml
   processing:
     enable_notch_filter: false
     enable_bandpass_filter: false
   ```

3. **Reduce logging:**
   ```yaml
   logging:
     level: "WARNING"  # Change from DEBUG/INFO
   ```

### Disk Space Issues

**Problem:** `/var/ecg_cache` filling up

**Solutions:**

```bash
# Check cache size
du -sh /var/ecg_cache

# Clean old cached batches (if streamer is stuck)
find /var/ecg_cache -name "*.json.gz" -mtime +1 -delete

# Increase cache limit in config
# pi-config.yaml:
#   buffer:
#     max_cache_size_mb: 1000  # Increase if needed
```

### Service Won't Start

**Problem:** `systemctl start ecg-collector.service` fails

**Solutions:**

```bash
# Check service status
sudo systemctl status ecg-collector.service

# View detailed logs
sudo journalctl -xeu ecg-collector.service

# Common issues:
# 1. Wrong Python path
which python3  # Should be /usr/bin/python3

# 2. Missing dependencies
pip3 list | grep spidev

# 3. Permission issues
sudo chown -R pi:pi /opt/ecg_monitor
sudo chown -R pi:pi /var/ecg_cache

# 4. Config file issues
python3 -c "import yaml; yaml.safe_load(open('/opt/ecg_monitor/pi-config.yaml'))"
```

---

## Monitoring and Maintenance

### Daily Health Checks

```bash
# Create monitoring script
cat > /home/pi/check_ecg.sh << 'EOF'
#!/bin/bash
echo "=== ECG Monitor Health Check ==="
echo
echo "Services:"
systemctl is-active ecg-collector.service
systemctl is-active ecg-streamer.service
echo
echo "Cache usage:"
du -sh /var/ecg_cache
echo
echo "Recent logs (collector):"
tail -5 /var/log/ecg_monitor/collector.log
echo
echo "Recent logs (streamer):"
tail -5 /var/log/ecg_monitor/streamer.log
EOF

chmod +x /home/pi/check_ecg.sh

# Run it
./check_ecg.sh
```

### Log Rotation

```bash
# Create logrotate config
sudo nano /etc/logrotate.d/ecg-monitor
```

**Content:**

```
/var/log/ecg_monitor/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 pi pi
}
```

### Automatic Cache Cleanup

```bash
# Add cron job to clean old cache
crontab -e

# Add line:
0 2 * * * find /var/ecg_cache -name "*.json.gz" -mtime +7 -delete
```

### Remote Monitoring

```bash
# Install monitoring agent (optional)
sudo apt install prometheus-node-exporter

# Enable at boot
sudo systemctl enable prometheus-node-exporter
sudo systemctl start prometheus-node-exporter
```

---

## Updating the Software

### Update from Git Repository

```bash
# Stop services
sudo systemctl stop ecg-collector.service ecg-streamer.service

# Backup current version
cd /opt/ecg_monitor
tar czf /home/pi/ecg_backup_$(date +%Y%m%d).tar.gz pi-collector/ pi-streamer/ pi-config.yaml

# Pull updates
git pull origin main

# Update dependencies
cd pi-collector && pip3 install -r requirements.txt --upgrade
cd ../pi-streamer && pip3 install -r requirements.txt --upgrade

# Restart services
sudo systemctl start ecg-collector.service ecg-streamer.service

# Verify
sudo systemctl status ecg-collector.service ecg-streamer.service
```

### Manual File Transfer Update

```bash
# From development machine
cd /path/to/ECG_Monitor
tar czf ecg_update.tar.gz pi-collector/ pi-streamer/
scp ecg_update.tar.gz pi@raspberrypi.local:/tmp/

# On Raspberry Pi
sudo systemctl stop ecg-collector.service ecg-streamer.service
cd /opt/ecg_monitor
tar xzf /tmp/ecg_update.tar.gz
sudo systemctl start ecg-collector.service ecg-streamer.service
```

### Rollback to Previous Version

```bash
# Stop services
sudo systemctl stop ecg-collector.service ecg-streamer.service

# Restore backup
cd /opt/ecg_monitor
tar xzf /home/pi/ecg_backup_YYYYMMDD.tar.gz

# Restart services
sudo systemctl start ecg-collector.service ecg-streamer.service
```

---

## Performance Tuning

### Optimize for 24/7 Operation

```bash
# Disable swap (extends SD card life)
sudo dphys-swapfile swapoff
sudo dphys-swapfile uninstall
sudo systemctl disable dphys-swapfile

# Reduce GPU memory (we don't need graphics)
sudo nano /boot/config.txt
# Add: gpu_mem=16

# Disable Bluetooth (if not needed)
sudo nano /boot/config.txt
# Add: dtoverlay=disable-bt
sudo systemctl disable hciuart

# Reduce journald logging
sudo nano /etc/systemd/journald.conf
# Set: SystemMaxUse=100M

# Reboot
sudo reboot
```

### Network Optimization

```bash
# Increase network buffer for MQTT
sudo nano /etc/sysctl.conf
# Add:
net.core.rmem_max=8388608
net.core.wmem_max=8388608

# Apply
sudo sysctl -p
```

---

## Quick Reference Commands

```bash
# Service management
sudo systemctl start ecg-collector.service
sudo systemctl stop ecg-collector.service
sudo systemctl restart ecg-collector.service
sudo systemctl status ecg-collector.service

# View logs
sudo journalctl -u ecg-collector.service -f
sudo journalctl -u ecg-streamer.service -f
tail -f /var/log/ecg_monitor/collector.log

# Check cache
ls -lh /var/ecg_cache/
du -sh /var/ecg_cache/

# Health check
systemctl is-active ecg-collector.service ecg-streamer.service
df -h /var/ecg_cache
top -b -n 1 | grep python3

# Manual run (for testing)
cd /opt/ecg_monitor/pi-collector
python3 main.py --config ../pi-config.yaml

# Mock mode (no hardware)
python3 main.py --config ../pi-config.yaml --mock
```

---

## Security Best Practices

1. **Change default password:**
   ```bash
   passwd
   ```

2. **Update regularly:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

3. **Enable firewall:**
   ```bash
   sudo apt install ufw
   sudo ufw allow 22/tcp  # SSH
   sudo ufw enable
   ```

4. **Secure certificates:**
   ```bash
   chmod 600 /home/pi/certs/device.key
   ```

5. **Disable root login:**
   ```bash
   sudo nano /etc/ssh/sshd_config
   # Set: PermitRootLogin no
   sudo systemctl restart ssh
   ```

---

## Getting Help

### Log Collection for Support

```bash
# Gather all diagnostic info
cat > /tmp/ecg_diagnostics.txt << EOF
=== System Info ===
$(uname -a)
$(cat /etc/os-release)

=== Service Status ===
$(systemctl status ecg-collector.service --no-pager)
$(systemctl status ecg-streamer.service --no-pager)

=== Recent Logs ===
$(tail -50 /var/log/ecg_monitor/collector.log)
$(tail -50 /var/log/ecg_monitor/streamer.log)

=== Configuration ===
$(cat /opt/ecg_monitor/pi-config.yaml | grep -v "key_path\|cert_path")

=== Network ===
$(ifconfig)
$(ping -c 3 google.com)
EOF

# Review and share (remove sensitive data first!)
cat /tmp/ecg_diagnostics.txt
```

### Additional Resources

- **CJMCU-1293 Datasheet**: [TI ADS1293 Documentation](https://www.ti.com/product/ADS1293)
- **AWS IoT Core**: [Developer Guide](https://docs.aws.amazon.com/iot/)
- **Raspberry Pi Documentation**: [Official Docs](https://www.raspberrypi.com/documentation/)
- **ECG Basics**: [MIT OpenCourseWare](https://ocw.mit.edu/)

---

## Summary

You now have:

✅ Raspberry Pi OS configured with SPI enabled
✅ CJMCU-1293 hardware connected
✅ AWS IoT Core certificates installed
✅ ECG Monitor software installed
✅ Configuration file customized
✅ Systemd services for auto-start
✅ Monitoring and maintenance procedures

**Next steps:**
1. Run initial test with mock data
2. Test with real hardware
3. Monitor for 24 hours to ensure stability
4. Check web dashboard for real-time data
5. Verify email alerts are working

**Estimated deployment time:** 45-60 minutes for experienced users, 2-3 hours for beginners.

Happy monitoring! 🫀
