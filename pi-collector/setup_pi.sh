#!/bin/bash
# ECG Monitor - Raspberry Pi Setup Script
# This script automates the installation and configuration process

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "======================================"
echo "  ECG Monitor - Raspberry Pi Setup"
echo "======================================"
echo

# Check if running on Raspberry Pi
if ! grep -q "Raspberry Pi" /proc/cpuinfo 2>/dev/null; then
    echo -e "${YELLOW}Warning: This doesn't appear to be a Raspberry Pi${NC}"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check for root privileges
if [[ $EUID -eq 0 ]]; then
   echo -e "${RED}Error: Do not run this script as root${NC}"
   echo "Run as regular user (pi), sudo will be used when needed"
   exit 1
fi

echo "Step 1: Updating system packages..."
sudo apt update
sudo apt upgrade -y

echo
echo "Step 2: Installing system dependencies..."
sudo apt install -y \
    python3-pip \
    python3-dev \
    python3-spidev \
    python3-rpi.gpio \
    git \
    vim \
    htop

echo
echo "Step 3: Enabling SPI interface..."
if ! grep -q "^dtparam=spi=on" /boot/config.txt; then
    echo "dtparam=spi=on" | sudo tee -a /boot/config.txt
    echo -e "${GREEN}✓ SPI enabled in /boot/config.txt${NC}"
    REBOOT_REQUIRED=1
else
    echo -e "${GREEN}✓ SPI already enabled${NC}"
fi

# Check if SPI is loaded
if ! lsmod | grep -q spi_bcm2835; then
    echo -e "${YELLOW}⚠ SPI module not loaded (will be available after reboot)${NC}"
    REBOOT_REQUIRED=1
fi

echo
echo "Step 4: Creating directory structure..."
sudo mkdir -p /opt/ecg_monitor
sudo mkdir -p /var/ecg_cache
sudo mkdir -p /var/log/ecg_monitor
mkdir -p /home/pi/certs

sudo chown -R pi:pi /opt/ecg_monitor
sudo chown -R pi:pi /var/ecg_cache
sudo chown -R pi:pi /var/log/ecg_monitor
chown -R pi:pi /home/pi/certs

echo -e "${GREEN}✓ Directories created${NC}"

echo
echo "Step 5: Copying application files..."
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Copy all necessary files
sudo cp -r "$PROJECT_ROOT/pi-collector" /opt/ecg_monitor/
sudo cp -r "$PROJECT_ROOT/pi-streamer" /opt/ecg_monitor/
sudo cp "$PROJECT_ROOT/config/pi-config.yaml" /opt/ecg_monitor/pi-config.yaml

sudo chown -R pi:pi /opt/ecg_monitor

echo -e "${GREEN}✓ Files copied to /opt/ecg_monitor${NC}"

echo
echo "Step 6: Installing Python dependencies..."
cd /opt/ecg_monitor/pi-collector
pip3 install -r requirements.txt

cd /opt/ecg_monitor/pi-streamer
pip3 install -r requirements.txt

echo -e "${GREEN}✓ Python packages installed${NC}"

echo
echo "Step 7: Checking certificate files..."
CERTS_OK=true
if [ ! -f /home/pi/certs/device.crt ]; then
    echo -e "${RED}✗ Missing: /home/pi/certs/device.crt${NC}"
    CERTS_OK=false
fi
if [ ! -f /home/pi/certs/device.key ]; then
    echo -e "${RED}✗ Missing: /home/pi/certs/device.key${NC}"
    CERTS_OK=false
fi
if [ ! -f /home/pi/certs/AmazonRootCA1.pem ]; then
    echo -e "${YELLOW}⚠ Missing: /home/pi/certs/AmazonRootCA1.pem${NC}"
    echo "  Downloading Amazon Root CA..."
    wget -q https://www.amazontrust.com/repository/AmazonRootCA1.pem -O /home/pi/certs/AmazonRootCA1.pem
    echo -e "${GREEN}✓ Downloaded Amazon Root CA${NC}"
fi

if [ "$CERTS_OK" = false ]; then
    echo
    echo -e "${YELLOW}Certificate files are missing!${NC}"
    echo "Please copy your AWS IoT certificates to /home/pi/certs/"
    echo "Required files:"
    echo "  - device.crt"
    echo "  - device.key"
    echo "  - AmazonRootCA1.pem"
    echo
    echo "You can copy them using SCP:"
    echo "  scp device.crt device.key pi@$(hostname -I | awk '{print $1}'):/home/pi/certs/"
else
    echo -e "${GREEN}✓ Certificate files found${NC}"

    # Set correct permissions
    chmod 644 /home/pi/certs/device.crt
    chmod 600 /home/pi/certs/device.key
    chmod 644 /home/pi/certs/AmazonRootCA1.pem
    echo -e "${GREEN}✓ Certificate permissions set${NC}"
fi

echo
echo "Step 8: Configuration file setup..."
echo -e "${YELLOW}⚠ You need to edit the configuration file:${NC}"
echo "  sudo nano /opt/ecg_monitor/pi-config.yaml"
echo
echo "Required changes:"
echo "  1. Set aws_iot.endpoint to your AWS IoT endpoint"
echo "  2. Set aws_iot.client_id to match your Thing name"
echo "  3. Verify certificate paths are correct"
echo

read -p "Open configuration file now? (Y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    sudo nano /opt/ecg_monitor/pi-config.yaml
fi

echo
echo "Step 9: Installing systemd services..."

# Create collector service
sudo tee /etc/systemd/system/ecg-collector.service > /dev/null << 'EOF'
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
EOF

# Create streamer service
sudo tee /etc/systemd/system/ecg-streamer.service > /dev/null << 'EOF'
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
EOF

# Reload systemd
sudo systemctl daemon-reload

echo -e "${GREEN}✓ Systemd services installed${NC}"

echo
echo "Step 10: Setting up log rotation..."
sudo tee /etc/logrotate.d/ecg-monitor > /dev/null << 'EOF'
/var/log/ecg_monitor/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 pi pi
}
EOF

echo -e "${GREEN}✓ Log rotation configured${NC}"

echo
echo "Step 11: Creating helper scripts..."

# Health check script
tee /home/pi/check_ecg.sh > /dev/null << 'EOF'
#!/bin/bash
echo "=== ECG Monitor Health Check ==="
echo
echo "Services:"
systemctl is-active ecg-collector.service && echo "  ✓ Collector: Running" || echo "  ✗ Collector: Stopped"
systemctl is-active ecg-streamer.service && echo "  ✓ Streamer: Running" || echo "  ✗ Streamer: Stopped"
echo
echo "Cache usage:"
du -sh /var/ecg_cache
echo
echo "Batch files:"
ls -lh /var/ecg_cache | tail -5
echo
echo "Recent collector logs:"
tail -5 /var/log/ecg_monitor/collector.log
echo
echo "Recent streamer logs:"
tail -5 /var/log/ecg_monitor/streamer.log
echo
echo "System resources:"
free -h | grep Mem
df -h /var/ecg_cache | tail -1
EOF

chmod +x /home/pi/check_ecg.sh

echo -e "${GREEN}✓ Health check script created: ~/check_ecg.sh${NC}"

echo
echo "======================================"
echo "  Installation Complete!"
echo "======================================"
echo

if [ "$REBOOT_REQUIRED" = "1" ]; then
    echo -e "${YELLOW}⚠ REBOOT REQUIRED${NC}"
    echo "SPI interface changes require a reboot"
    echo
    read -p "Reboot now? (Y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        sudo reboot
    fi
else
    echo "Next steps:"
    echo
    echo "1. Verify configuration:"
    echo "   sudo nano /opt/ecg_monitor/pi-config.yaml"
    echo
    echo "2. Test manually (mock mode):"
    echo "   cd /opt/ecg_monitor/pi-collector"
    echo "   python3 main.py --config ../pi-config.yaml --mock"
    echo
    echo "3. Enable and start services:"
    echo "   sudo systemctl enable ecg-collector.service ecg-streamer.service"
    echo "   sudo systemctl start ecg-collector.service ecg-streamer.service"
    echo
    echo "4. Check status:"
    echo "   ./check_ecg.sh"
    echo
    echo "For detailed documentation, see:"
    echo "  docs/raspberry-pi-deployment.md"
    echo
fi
