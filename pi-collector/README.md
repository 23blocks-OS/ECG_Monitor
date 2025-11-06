# ECG Data Collector (Raspberry Pi)

Collects ECG data from CJMCU-1293 (ADS1293) module via SPI.

## Features

- 3-channel ECG data acquisition
- Real-time signal processing (notch filter, bandpass filter)
- Local buffering with disk cache
- Configurable sampling rate (250/500 Hz)
- Mock mode for development without hardware

## Hardware Setup

### Connections

```
CJMCU-1293 → Raspberry Pi
VCC        → 3.3V (Pin 1)
GND        → GND (Pin 6)
SCLK       → GPIO11 (SPI0 SCLK, Pin 23)
MISO       → GPIO9 (SPI0 MISO, Pin 21)
MOSI       → GPIO10 (SPI0 MOSI, Pin 19)
CS         → GPIO8 (SPI0 CE0, Pin 24)
DRDY       → GPIO27 (Pin 13)
RESET      → GPIO17 (Pin 11)
```

### Enable SPI

```bash
sudo raspi-config
# Interface Options → SPI → Enable
sudo reboot
```

## Installation

```bash
cd pi-collector

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

## Configuration

Edit `../config/pi-config.yaml`:

```yaml
hardware:
  device: "CJMCU-1293"
  spi_bus: 0
  spi_device: 0
  gpio_reset_pin: 17
  gpio_drdy_pin: 27

ecg:
  channels: 3
  sampling_rate_hz: 250
```

## Usage

### Real Hardware

```bash
# Make sure SPI is enabled
sudo python3 main.py --config ../config/pi-config.yaml
```

### Mock Mode (Testing)

```bash
# Run without hardware (for development)
python3 main.py --mock
```

## Output

Data is buffered locally and cached to disk:
- In-memory buffer: 30 seconds
- Disk cache: Up to 500 MB
- Cache location: `/var/ecg_cache/`

## Integration with Streamer

In production, this collector runs alongside the cloud streamer:

```bash
# Terminal 1: Collector
python3 main.py

# Terminal 2: Streamer
cd ../pi-streamer
python3 main.py
```

Or use the supervisor script (see `../docs/setup-raspberry-pi.md`).

## Troubleshooting

### Permission Denied (SPI)

```bash
# Add user to spi group
sudo usermod -a -G spi $USER
sudo usermod -a -G gpio $USER

# Reboot
sudo reboot
```

### GPIO Permission Denied

```bash
# Run with sudo
sudo python3 main.py
```

### Mock Mode Not Working

```bash
# Install dependencies without hardware libs
pip install pyyaml numpy
```

## Files

- `main.py` - Main collector script
- `ecg_reader.py` - SPI interface for CJMCU-1293
- `signal_processor.py` - Digital signal processing
- `buffer_manager.py` - Local data buffering
- `requirements.txt` - Python dependencies
