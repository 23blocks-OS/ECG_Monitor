# Raspberry Pi Quick Reference Card

Quick commands and troubleshooting for ECG Monitor on Raspberry Pi.

## 🚀 Quick Start

```bash
# Run automated setup
cd /path/to/ECG_Monitor/pi-collector
./setup_pi.sh

# OR manual setup - see docs/raspberry-pi-deployment.md
```

## 📋 Service Management

```bash
# Start services
sudo systemctl start ecg-collector.service ecg-streamer.service

# Stop services
sudo systemctl stop ecg-collector.service ecg-streamer.service

# Restart services
sudo systemctl restart ecg-collector.service ecg-streamer.service

# Check status
sudo systemctl status ecg-collector.service
sudo systemctl status ecg-streamer.service

# Enable auto-start on boot
sudo systemctl enable ecg-collector.service ecg-streamer.service

# Disable auto-start
sudo systemctl disable ecg-collector.service ecg-streamer.service
```

## 📊 Monitoring

```bash
# Health check (all-in-one)
./check_ecg.sh

# View live logs
sudo journalctl -u ecg-collector.service -f
sudo journalctl -u ecg-streamer.service -f

# View log files
tail -f /var/log/ecg_monitor/collector.log
tail -f /var/log/ecg_monitor/streamer.log

# Check cache size
du -sh /var/ecg_cache
ls -lh /var/ecg_cache | head -20

# Check system resources
htop
df -h
free -h

# Network activity
sudo iftop
```

## 🧪 Testing

```bash
# Test in mock mode (no hardware)
cd /opt/ecg_monitor/pi-collector
python3 main.py --config ../pi-config.yaml --mock

# Test collector only
python3 main.py --config ../pi-config.yaml

# Test streamer only
cd /opt/ecg_monitor/pi-streamer
python3 main.py --config ../pi-config.yaml

# Verify SPI interface
ls -l /dev/spidev*
# Should show: /dev/spidev0.0 and /dev/spidev0.1

# Check SPI module loaded
lsmod | grep spi
# Should show: spi_bcm2835

# Test certificate connection
openssl s_client -connect YOUR_ENDPOINT.iot.us-east-1.amazonaws.com:8883 \
  -CAfile /home/pi/certs/AmazonRootCA1.pem \
  -cert /home/pi/certs/device.crt \
  -key /home/pi/certs/device.key
```

## 🔧 Configuration

```bash
# Edit main config
sudo nano /opt/ecg_monitor/pi-config.yaml

# Validate YAML syntax
python3 -c "import yaml; yaml.safe_load(open('/opt/ecg_monitor/pi-config.yaml'))"

# Get AWS IoT endpoint
# (Run on your dev machine)
aws iot describe-endpoint --endpoint-type iot:Data-ATS

# Check certificate permissions
ls -l /home/pi/certs/
# device.crt should be 644
# device.key should be 600

# Fix certificate permissions
chmod 644 /home/pi/certs/device.crt
chmod 600 /home/pi/certs/device.key
chmod 644 /home/pi/certs/AmazonRootCA1.pem
```

## 🐛 Troubleshooting

### SPI Not Working

```bash
# Enable SPI
sudo raspi-config
# Interface Options > SPI > Yes

# Verify enabled
sudo grep spi /boot/config.txt
# Should show: dtparam=spi=on

# Reboot required after enabling
sudo reboot
```

### GPIO Permission Denied

```bash
# Add user to gpio group
sudo usermod -aG gpio pi

# Logout and login again
exit
# Then SSH back in

# Verify
groups
# Should include: gpio
```

### Service Won't Start

```bash
# Check detailed error
sudo journalctl -xeu ecg-collector.service

# Common fixes:
# 1. Config file syntax
python3 -c "import yaml; yaml.safe_load(open('/opt/ecg_monitor/pi-config.yaml'))"

# 2. Permissions
sudo chown -R pi:pi /opt/ecg_monitor
sudo chown -R pi:pi /var/ecg_cache
sudo chown -R pi:pi /var/log/ecg_monitor

# 3. Missing dependencies
pip3 install -r /opt/ecg_monitor/pi-collector/requirements.txt
pip3 install -r /opt/ecg_monitor/pi-streamer/requirements.txt

# 4. Reload systemd
sudo systemctl daemon-reload
```

### AWS IoT Connection Failed

```bash
# Check certificate files exist
ls -l /home/pi/certs/

# Test network connectivity
ping YOUR_ENDPOINT.iot.us-east-1.amazonaws.com

# Download Root CA if missing
cd /home/pi/certs
wget https://www.amazontrust.com/repository/AmazonRootCA1.pem

# Check IoT policy (on dev machine)
aws iot list-attached-policies --target YOUR_CERT_ARN
```

### Disk Full

```bash
# Check disk usage
df -h

# Clean old cache files
find /var/ecg_cache -name "*.json.gz" -mtime +1 -delete

# Check log sizes
du -sh /var/log/ecg_monitor/

# Clear old logs
sudo rm /var/log/ecg_monitor/*.log.*.gz
```

### High CPU Usage

```bash
# Check CPU usage
top -p $(pgrep -f ecg_monitor)

# Reduce sampling rate (in config)
# ecg.sampling_rate_hz: 125

# Reduce logging level (in config)
# logging.level: WARNING

# Disable filters temporarily (in config)
# processing.enable_notch_filter: false
# processing.enable_bandpass_filter: false

# Restart after config changes
sudo systemctl restart ecg-collector.service
```

### No ECG Signal

```bash
# 1. Check hardware connections
# Verify all pins connected correctly

# 2. Test with mock data
cd /opt/ecg_monitor/pi-collector
python3 main.py --config ../pi-config.yaml --mock

# 3. Check DRDY pin
gpio -g mode 27 in
gpio -g read 27
# Should toggle between 0 and 1

# 4. Verify electrode placement
# Clean skin with alcohol wipe
# Ensure good contact
```

## 🔄 Updates

```bash
# Backup current installation
tar czf ~/ecg_backup_$(date +%Y%m%d).tar.gz /opt/ecg_monitor

# Update from git
cd /opt/ecg_monitor
git pull

# Update Python dependencies
cd pi-collector && pip3 install -r requirements.txt --upgrade
cd ../pi-streamer && pip3 install -r requirements.txt --upgrade

# Restart services
sudo systemctl restart ecg-collector.service ecg-streamer.service

# Rollback if needed
sudo systemctl stop ecg-collector.service ecg-streamer.service
tar xzf ~/ecg_backup_YYYYMMDD.tar.gz -C /
sudo systemctl start ecg-collector.service ecg-streamer.service
```

## 📁 Important Files & Directories

```
/opt/ecg_monitor/          # Main application directory
  ├── pi-collector/        # ECG data collection
  ├── pi-streamer/         # Cloud streaming
  └── pi-config.yaml       # Configuration file

/home/pi/certs/            # AWS IoT certificates
  ├── device.crt           # Device certificate
  ├── device.key           # Private key (600 permissions!)
  └── AmazonRootCA1.pem    # Amazon Root CA

/var/ecg_cache/            # Local data cache
  └── batch_*.json.gz      # 10-second ECG batches

/var/log/ecg_monitor/      # Log files
  ├── collector.log        # Collector logs
  └── streamer.log         # Streamer logs

/etc/systemd/system/       # Service definitions
  ├── ecg-collector.service
  └── ecg-streamer.service

/home/pi/check_ecg.sh      # Health check script
```

## 🌐 AWS Verification

```bash
# From your development machine:

# Check S3 for data
aws s3 ls s3://YOUR_BUCKET/raw-data/device_id=ecg-device-001/ --recursive --human-readable | tail

# Monitor IoT Core messages
# AWS Console > IoT Core > Test > MQTT test client
# Subscribe to: ecg/device001/#

# Check DynamoDB for sessions
aws dynamodb scan --table-name ecg-monitor-poc-sessions --limit 5

# View CloudWatch metrics
# AWS Console > CloudWatch > Metrics > IoT
```

## 💾 Backup & Restore

```bash
# Full backup
tar czf ~/ecg_full_backup_$(date +%Y%m%d).tar.gz \
  /opt/ecg_monitor \
  /home/pi/certs \
  /var/ecg_cache

# Configuration only
cp /opt/ecg_monitor/pi-config.yaml ~/pi-config.yaml.backup

# Restore
tar xzf ~/ecg_full_backup_YYYYMMDD.tar.gz -C /
sudo systemctl restart ecg-collector.service ecg-streamer.service
```

## ⚙️ Performance Optimization

```bash
# Disable swap (extends SD card life)
sudo dphys-swapfile swapoff
sudo systemctl disable dphys-swapfile

# Reduce GPU memory
sudo nano /boot/config.txt
# Add: gpu_mem=16

# Disable Bluetooth (if not needed)
sudo nano /boot/config.txt
# Add: dtoverlay=disable-bt
sudo systemctl disable hciuart

# Apply changes
sudo reboot
```

## 📞 Emergency Commands

```bash
# Stop everything immediately
sudo systemctl stop ecg-collector.service ecg-streamer.service

# Clear cache completely
sudo rm -rf /var/ecg_cache/*

# Reset to factory state (nuclear option)
sudo systemctl stop ecg-collector.service ecg-streamer.service
sudo rm -rf /opt/ecg_monitor
sudo rm -rf /var/ecg_cache
sudo rm -rf /var/log/ecg_monitor
# Then run setup_pi.sh again
```

## 📱 Remote Access

```bash
# Setup static IP (optional)
sudo nano /etc/dhcpcd.conf
# Add:
# interface wlan0
# static ip_address=192.168.1.100/24
# static routers=192.168.1.1
# static domain_name_servers=8.8.8.8

# Enable VNC (for GUI access)
sudo raspi-config
# Interface Options > VNC > Enable

# Port forwarding for remote SSH
# Configure router to forward external:22 -> Pi:22
# Then access via: ssh pi@your.public.ip
```

## 🎯 Daily Checks

```bash
# Morning routine
./check_ecg.sh                           # Health check
df -h                                     # Disk space
tail -20 /var/log/ecg_monitor/collector.log  # Recent logs

# If issues found
sudo systemctl restart ecg-collector.service ecg-streamer.service
```

## 📚 Documentation

- **Full deployment guide**: `docs/raspberry-pi-deployment.md`
- **Architecture**: `ARCHITECTURE.md`
- **Testing**: `TESTING_GUIDE.md`
- **AWS deployment**: `docs/aws-deployment.md`

## 🆘 Support

```bash
# Gather diagnostics
cat > /tmp/diagnostics.txt << EOF
System: $(uname -a)
Services: $(systemctl is-active ecg-collector.service ecg-streamer.service)
Cache: $(du -sh /var/ecg_cache)
Logs: $(tail -20 /var/log/ecg_monitor/collector.log)
EOF

# Review and share (remove sensitive info!)
cat /tmp/diagnostics.txt
```

---

**💡 Tip**: Print this page and keep it near your Raspberry Pi for quick reference!
