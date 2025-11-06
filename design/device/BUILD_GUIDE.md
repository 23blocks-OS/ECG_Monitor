# Portable ECG Monitor - Build Guide

> Step-by-step instructions to build your own portable ECG monitor

---

## 🚀 Quick Overview

**What you'll build:**
- Pocket-sized ECG monitor (85mm × 65mm × 28mm)
- 24+ hour battery life
- OLED display for real-time stats
- Belt clip or pocket carry
- Full WiFi connectivity to cloud

**Build Difficulty:** Intermediate (soldering required)
**Build Time:** 4-6 hours (first build)
**Total Cost:** ~$140

---

## 📋 Phase 1: Ordering Components

### Essential Components

Use the [complete components list](components.md) for detailed specs. Quick shopping list:

**From Adafruit (~$60):**
- [ ] Raspberry Pi Zero 2W ($15)
- [ ] PowerBoost 1000 Charger ($20)
- [ ] 5000mAh LiPo Battery ($25)

**From Amazon (~$30):**
- [ ] 0.96" OLED Display (128×64 I2C) ($7)
- [ ] ECG Electrode Wires (3×) ($8)
- [ ] Disposable Electrodes 50-pack ($15)

**From AliExpress/eBay (~$25):**
- [ ] CJMCU-1293 ECG Module ($25)

**From DigiKey/Mouser (~$10):**
- [ ] LEDs (3× - red, blue, green) ($1)
- [ ] Resistors (470Ω, 5×) ($1)
- [ ] Slide Switch SPDT ($1)
- [ ] M3 screws & heat-set inserts ($3)
- [ ] Assorted wire, JST connectors ($4)

**PCB Fabrication (~$10):**
- [ ] Custom interconnect board from JLCPCB (5 pieces)

**3D Printing (~$7):**
- [ ] Enclosure (top + bottom) in PETG
- [ ] Belt clip
- [ ] Button caps (if using buttons)

### Tools Needed

**Essential:**
- [ ] Soldering iron (temperature controlled)
- [ ] Solder (lead-free recommended)
- [ ] Wire strippers
- [ ] Small Phillips screwdriver
- [ ] Multimeter
- [ ] Flush cutters
- [ ] Helping hands or PCB holder

**Nice to Have:**
- [ ] Hot glue gun (strain relief)
- [ ] Heat gun (heat-shrink tubing)
- [ ] Desoldering pump/wick
- [ ] Fume extractor

---

## 🔧 Phase 2: Breadboard Prototype

**Before committing to the full build, test everything on a breadboard!**

### Step 1: Test Display

```bash
# Enable I2C on Pi Zero
sudo raspi-config
# Interface Options → I2C → Enable

# Install libraries
pip3 install adafruit-circuitpython-ssd1306 pillow

# Test display
python3 test_display.py  # See display-interface.md for test code
```

**Wiring:**
```
OLED → Pi Zero
─────────────
VCC  → Pin 1 (3.3V)
GND  → Pin 6 (GND)
SCL  → Pin 5 (GPIO 3)
SDA  → Pin 3 (GPIO 2)
```

### Step 2: Test ECG Module

*(Assumes you already have CJMCU-1293 working from main project)*

Connect via SPI and verify readings:
```bash
cd ~/ECG_Monitor/pi-collector
python3 main.py
```

### Step 3: Test Battery & Power

⚠️ **IMPORTANT: Double-check polarity before connecting battery!**

```
Battery+ (red)  → PowerBoost BAT+
Battery- (black) → PowerBoost BAT-

PowerBoost 5V+ → Pi Zero 5V (Pin 2)
PowerBoost GND → Pi Zero GND (Pin 6)
```

**Test:**
1. Connect battery to PowerBoost
2. Switch on PowerBoost
3. Pi Zero should boot (ACT LED blinks)
4. Measure voltage at Pi: should be 5.0-5.2V

### Step 4: Test Full System

Once all components work individually, connect everything:

```
            ┌─────────────┐
            │  Pi Zero 2W │
            └──┬───┬───┬──┘
               │   │   │
        ┌──────┘   │   └──────┐
        │          │          │
    ┌───▼──┐   ┌───▼───┐  ┌──▼─────┐
    │ OLED │   │ CJMCU │  │ LEDs   │
    │      │   │ ECG   │  │ (3×)   │
    └──────┘   └───────┘  └────────┘
                   │
            ┌──────▼──────┐
            │  Electrodes │
            │  (3× wires) │
            └─────────────┘

    Power from:
    ┌────────────┐     ┌────────────┐
    │  Battery   │────▶│ PowerBoost │──▶ Pi Zero
    │  5000mAh   │     │   1000C    │
    └────────────┘     └────────────┘
```

**Full System Test:**
```bash
# Start ECG monitoring with display
python3 portable_ecg_main.py  # New script combining collector + display
```

---

## 🏗️ Phase 3: PCB Design (Optional but Recommended)

**Option A: Skip PCB, use prototype board**
- Solder components to perfboard
- Point-to-point wiring
- Faster but messier

**Option B: Design custom PCB**
- Cleaner, more reliable
- One-time effort, multiple builds
- Professional appearance

### PCB Design Steps (using KiCad)

1. **Install KiCad** (free): https://www.kicad.org/

2. **Create schematic:**
   - Pi Zero header (40-pin)
   - CJMCU-1293 connections (SPI)
   - OLED header (I2C)
   - PowerBoost connections
   - LED circuits with resistors
   - Power switch
   - Electrode connectors

3. **Layout PCB:**
   - Size: 70mm × 60mm (to fit enclosure)
   - 2 layers (enough for this design)
   - Keep SPI traces short
   - Ground plane on bottom layer

4. **Generate Gerber files:**
   - File → Plot
   - Export Gerber + Drill files

5. **Order from JLCPCB:**
   - Upload ZIP of Gerber files
   - Quantity: 5 (minimum, $2)
   - Shipping: ~$8 (1-2 weeks)
   - Total: ~$10

6. **Wait for delivery** (1-2 weeks from China)

**Schematic Reference** (simplified):
```
                    ┌─────────────────┐
                    │  Raspberry Pi   │
                    │   Zero 2W       │
                    │                 │
    ┌───────────────┤ GPIO 2 (SDA)    │
    │               ├─────────────────┤
    │           ┌───┤ GPIO 3 (SCL)    │
    │           │   ├─────────────────┤
    │           │   │ GPIO 8 (CE0)    │────┐
    │           │   ├─────────────────┤    │
    │           │   │ GPIO 10 (MOSI)  │────┼────┐
    │           │   ├─────────────────┤    │    │
    │           │   │ GPIO 9 (MISO)   │────┼────┼────┐
    │           │   ├─────────────────┤    │    │    │
    │           │   │ GPIO 11 (SCLK)  │────┼────┼────┼───┐
    │           │   ├─────────────────┤    │    │    │   │
    │           │   │ GPIO 17         │────┼────┼────┼───┼──┐LED1
    │           │   ├─────────────────┤    │    │    │   │  │
    │           │   │ 5V (Pin 2)      │◄───┼────┼────┼───┼──┼──PowerBoost 5V+
    │           │   ├─────────────────┤    │    │    │   │  │
    │           │   │ GND (Pin 6)     │◄───┼────┼────┼───┼──┼──GND
    │           │   └─────────────────┘    │    │    │   │  │
    │           │                           │    │    │   │  │
    │    ┌──────▼────────┐        ┌────────▼────▼────▼───▼──▼─┐
    │    │  OLED Display │        │  CJMCU-1293 ECG Module   │
    │    │  (128×64 I2C) │        │  (SPI)                    │
    │    │               │        │                           │
    │    │ VCC GND SCL SDA│        │ VCC GND CS MOSI MISO CLK │
    │    └───────────────┘        └───┬────┬────┬────────────┘
    │                                  │    │    │
    └──────────────────────────────────┘    │    └──────┐
                                            │           │
                                    ┌───────▼───────────▼────┐
                                    │  Electrode Connectors  │
                                    │  RA     LA     LL      │
                                    └────────────────────────┘
```

---

## 🔨 Phase 4: Assembly

### Step 1: Prepare Components

1. **Solder headers to Pi Zero:**
   - 40-pin male header
   - Solder from bottom, pins up
   - Check continuity

2. **Prepare PowerBoost:**
   - Solder wires to BAT+ and BAT- pads
   - Solder wires to 5V and GND output
   - Add JST connector for battery

3. **Prepare display:**
   - Solder pin header if not pre-attached

4. **Install heat-set inserts in enclosure:**
   - Heat soldering iron to 200°C
   - Press insert into hole gently
   - Let cool before removing iron

### Step 2: PCB Assembly

**Solder order (bottom to top):**

1. **Resistors** (470Ω for LEDs)
2. **JST connector** (for battery)
3. **Switch** (power switch)
4. **Pin headers** (for Pi, OLED, CJMCU)
5. **LEDs** (watch polarity! flat side = cathode)
6. **Electrode connectors**

**Inspection:**
- Check for solder bridges
- Verify continuity with multimeter
- Check all polarities

### Step 3: Install Pi Zero

1. **Insert Pi Zero into header**
2. **Secure with M3 screws** (if mounting holes)
3. **Connect power wires**:
   - PowerBoost 5V → Pi 5V (Pin 2)
   - PowerBoost GND → Pi GND (Pin 6)

### Step 4: Connect Peripherals

1. **OLED Display:**
   - VCC → 3.3V
   - GND → GND
   - SCL → GPIO 3
   - SDA → GPIO 2

2. **CJMCU-1293:**
   - VCC → 3.3V
   - GND → GND
   - CS → GPIO 8
   - MOSI → GPIO 10
   - MISO → GPIO 9
   - SCLK → GPIO 11

3. **Status LEDs:**
   - LED+ → GPIO (via 470Ω resistor)
   - LED- → GND

### Step 5: Connect Battery

⚠️ **DOUBLE-CHECK POLARITY!**

1. **Measure battery voltage**: Should be 3.7-4.2V
2. **Check PowerBoost polarity**: Red to BAT+, Black to BAT-
3. **Connect battery**: Plug in JST connector
4. **Verify power**: Pi should NOT turn on yet (switch is off)
5. **Flip switch**: Pi should boot (green ACT LED)

### Step 6: Enclosure Assembly

1. **Route electrode wires** through side holes
2. **Place battery in lower compartment**
3. **Mount PCB assembly** with standoffs
4. **Connect all wires** (strain relief with hot glue)
5. **Test before closing**: Power on, verify all functions
6. **Close enclosure**:
   - Align top and bottom halves
   - Insert M3 screws (6×)
   - Tighten evenly (don't over-tighten)
7. **Attach belt clip** to back
8. **Install rubber feet** on bottom

---

## 💻 Phase 5: Software Setup

### Step 1: Base System Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y python3-pip git i2c-tools

# Enable I2C and SPI
sudo raspi-config
# Interface Options → I2C → Enable
# Interface Options → SPI → Enable

# Reboot
sudo reboot
```

### Step 2: Install Python Libraries

```bash
pip3 install RPi.GPIO
pip3 install adafruit-circuitpython-ssd1306
pip3 install pillow
pip3 install spidev
pip3 install requests
pip3 install paho-mqtt
```

### Step 3: Clone Repository

```bash
cd ~
git clone https://github.com/23blocks-OS/ECG_Monitor.git
cd ECG_Monitor
```

### Step 4: Create Portable Version Script

Create `/home/pi/ECG_Monitor/pi-portable/main.py`:

```python
#!/usr/bin/env python3
"""
Portable ECG Monitor - Main Script
Combines ECG collection, display, and cloud upload
"""

import sys
import time
import threading
sys.path.append('/home/pi/ECG_Monitor/pi-collector')
sys.path.append('/home/pi/ECG_Monitor/pi-streamer')

# Import existing modules
from ecg_reader import ECGReader
from signal_processor import SignalProcessor
from iot_client import IoTClient

# Import display manager
from display_manager import DisplayManager

# Import battery monitor
from battery_monitor import BatteryMonitor

def main():
    print("Starting Portable ECG Monitor...")

    # Initialize components
    ecg = ECGReader()
    processor = SignalProcessor()
    cloud = IoTClient()
    display = DisplayManager()
    battery = BatteryMonitor()

    # Start background threads
    threading.Thread(target=ecg_collection_loop, daemon=True).start()
    threading.Thread(target=cloud_upload_loop, daemon=True).start()
    threading.Thread(target=display_update_loop, daemon=True).start()
    threading.Thread(target=battery_monitor_loop, daemon=True).start()

    # Main loop
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\\nShutting down gracefully...")
        display.show_message("Shutting down...")
        time.sleep(2)
        display.clear()

if __name__ == '__main__':
    main()
```

See [display-interface.md](display-interface.md) for full display code.

### Step 5: Auto-Start on Boot

```bash
# Create systemd service
sudo nano /etc/systemd/system/ecg-portable.service
```

**Service file:**
```ini
[Unit]
Description=Portable ECG Monitor
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/ECG_Monitor/pi-portable
ExecStart=/usr/bin/python3 /home/pi/ECG_Monitor/pi-portable/main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Enable service:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable ecg-portable
sudo systemctl start ecg-portable

# Check status
sudo systemctl status ecg-portable
```

---

## ✅ Phase 6: Testing

### Test 1: Power-On Test

- [ ] Power switch turns device on/off
- [ ] Power LED lights up (blue)
- [ ] Display shows boot screen
- [ ] Pi boots successfully (green ACT LED blinks)

### Test 2: Display Test

- [ ] Display shows text clearly
- [ ] Heart rate displayed
- [ ] Battery percentage shown
- [ ] Status messages appear
- [ ] LEDs blink correctly

### Test 3: ECG Signal Test

- [ ] Attach electrodes to chest
- [ ] ECG waveform visible in Graph Mode
- [ ] Heart rate calculated correctly
- [ ] Activity LED blinks with heartbeat

### Test 4: WiFi & Cloud Test

- [ ] Device connects to WiFi
- [ ] WiFi icon shows connected
- [ ] Data uploads to cloud
- [ ] Dashboard shows live data

### Test 5: Battery Test

- [ ] Battery percentage updates
- [ ] Device runs for 24+ hours
- [ ] Low battery warning at 20%
- [ ] Critical warning at 10%
- [ ] Graceful shutdown at 5%

### Test 6: Charging Test

- [ ] Plug in micro-USB charger
- [ ] Charging LED lights up (red)
- [ ] Can use device while charging
- [ ] LED turns off when full
- [ ] Full charge takes 6-7 hours

### Test 7: Wearability Test

- [ ] Comfortable to wear for 8+ hours
- [ ] Belt clip holds securely
- [ ] Electrode wires don't pull
- [ ] Not too heavy
- [ ] Survives daily activities

---

## 🐛 Troubleshooting

### Problem: Display doesn't work

**Possible causes:**
- I2C not enabled → `sudo raspi-config`
- Wrong I2C address → Try 0x3C or 0x3D
- Bad wiring → Check continuity
- Faulty display → Test with multimeter

**Debug:**
```bash
# Check if display detected
sudo i2cdetect -y 1
# Should show device at 0x3C or 0x3D
```

### Problem: ECG signal noisy

**Possible causes:**
- Poor electrode contact → Replace electrodes
- Electrode placement → Follow diagram
- Interference → Away from power lines
- Grounding issue → Check GND connections

### Problem: Battery drains too fast

**Possible causes:**
- WiFi always on → Enable periodic mode
- Display too bright → Enable auto-dim
- Old battery → Replace if >500 cycles
- High CPU usage → Check for runaway processes

**Debug:**
```bash
# Check power consumption
vcgencmd measure_volts
vcgencmd get_throttled

# Check CPU usage
top
```

### Problem: Won't boot

**Possible causes:**
- No power → Check battery voltage (should be >3.5V)
- Polarity reversed → CHECK IMMEDIATELY, may be damaged
- Insufficient current → PowerBoost rated for 1A, should be OK
- SD card corrupted → Try different card

---

## 📈 Next Steps & Improvements

### Immediate Improvements

1. **Add physical buttons** for mode switching
2. **Implement touch sensor** for wake-up
3. **Add buzzer** for audio alerts
4. **Improve enclosure** with better ergonomics

### Advanced Features

1. **GPS module** for location tracking
2. **Cellular modem** for no-WiFi areas
3. **Larger battery** for multi-day use
4. **SD card** for local data storage
5. **Bluetooth LE** for phone app

### Software Enhancements

1. **Better power management** (sleep modes)
2. **On-device AI** (local arrhythmia detection)
3. **Data compression** (reduce bandwidth)
4. **OTA updates** (remote firmware updates)
5. **User profiles** (multiple wearers)

---

## 📚 Additional Resources

- [Detailed Component Specs](components.md)
- [Display Interface Guide](display-interface.md)
- [Battery System Design](battery-system.md)
- [Visual Concepts](visual-concepts.md)
- [Pi Zero 2W Pinout](https://pinout.xyz/)
- [KiCad Tutorial](https://docs.kicad.org/)
- [ECG Electrode Placement](https://en.wikipedia.org/wiki/Electrocardiography)

---

## 🎉 Congratulations!

You've built a portable, battery-powered, cloud-connected ECG monitor!

### What You've Achieved:

✅ Pocket-sized personal health device
✅ 24/7 continuous heart monitoring
✅ Real-time display and alerts
✅ Cloud AI analysis with Claude
✅ Professional-looking enclosure
✅ All for ~$140!

### Share Your Build!

- Post photos on GitHub Issues
- Submit improvements via Pull Requests
- Share your experience with the community
- Help others troubleshoot their builds

---

**Safety Reminder:**

⚠️ This is a personal research project, NOT a medical device.
Not intended for diagnosis or treatment. Always consult healthcare professionals.

---

**Last Updated:** 2025-11-06
**Build Guide Version:** 1.0
**Maintainer:** Juan Pelaez
