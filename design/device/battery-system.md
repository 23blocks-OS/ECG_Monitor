# Battery System Design - Portable ECG Monitor

> Complete battery, charging, and power management system

---

## Overview

The portable ECG monitor requires a reliable battery system to provide 24+ hours of continuous operation. This document covers battery selection, charging, power management, and safety considerations.

---

## Battery Selection

### Chosen: 5000mAh 3.7V LiPo

**Key Specifications:**
- **Capacity**: 5000mAh (5Ah)
- **Voltage**: 3.7V nominal (4.2V max, 3.0V min)
- **Energy**: 18.5 Wh (watt-hours)
- **Chemistry**: Lithium Polymer (LiPo)
- **Form Factor**: Prismatic (flat rectangular)
- **Size**: ~60mm × 50mm × 8mm
- **Weight**: ~80g
- **Connector**: JST-PH 2.0mm (standard)
- **Protection**: Built-in PCM (protection circuit module)
- **Charge Rate**: 1C max (5A, but we'll use 1A)
- **Discharge Rate**: 2C continuous (10A)
- **Cycle Life**: 300-500 cycles (to 80% capacity)

**Protection Features (Built-in PCM):**
- ✅ Over-charge protection (>4.25V)
- ✅ Over-discharge protection (<2.75V)
- ✅ Short-circuit protection
- ✅ Over-current protection (>10A)

---

## Power Budget Analysis

### Component Power Consumption

| Component | Voltage | Current | Power | Notes |
|-----------|---------|---------|-------|-------|
| **Raspberry Pi Zero 2W** | 5V | 100-400mA | 0.5-2.0W | Varies with WiFi |
| Pi Zero (idle) | 5V | 100mA | 0.5W | WiFi off |
| Pi Zero (active) | 5V | 200mA | 1.0W | Processing |
| Pi Zero (WiFi TX) | 5V | 400mA | 2.0W | Peak transmission |
| **CJMCU-1293 ECG** | 3.3V | 5mA | 0.015W | Constant |
| **OLED Display** | 3.3V | 3mA | 0.010W | Average (varies by pixels) |
| Display (full white) | 3.3V | 8mA | 0.026W | Worst case |
| Display (sleep) | 3.3V | 1mA | 0.003W | Dim mode |
| **LEDs (3×)** | 3.3V | 5mA ea | 0.015W | All on |
| **PowerBoost Efficiency** | - | - | 15% loss | ~85% efficient |

### Operating Modes

#### Mode 1: Active WiFi Streaming
```
Pi Zero (WiFi active):   2.0W
CJMCU-1293:              0.015W
OLED (normal):           0.010W
LEDs:                    0.015W
─────────────────────────────
Subtotal:                2.04W
PowerBoost loss (15%):   +0.36W
─────────────────────────────
Total:                   2.40W
```

**Runtime**: 18.5Wh ÷ 2.40W = **7.7 hours**

#### Mode 2: Periodic WiFi (Every 5 minutes)
```
Average:
  - 55 seconds idle:     0.5W × 91.7% = 0.46W
  - 5 seconds WiFi TX:   2.0W × 8.3% = 0.17W

Pi Zero (average):       0.63W
CJMCU-1293:              0.015W
OLED (normal):           0.010W
LEDs (1× blinking):      0.005W
─────────────────────────────
Subtotal:                0.66W
PowerBoost loss (15%):   +0.12W
─────────────────────────────
Total:                   0.78W
```

**Runtime**: 18.5Wh ÷ 0.78W = **23.7 hours** ✅

#### Mode 3: Optimized (Display Sleep + Periodic WiFi)
```
Pi Zero (periodic WiFi): 0.63W
CJMCU-1293:              0.015W
OLED (sleep mode):       0.003W
LEDs (activity only):    0.002W
─────────────────────────────
Subtotal:                0.65W
PowerBoost loss (15%):   +0.11W
─────────────────────────────
Total:                   0.76W
```

**Runtime**: 18.5Wh ÷ 0.76W = **24.3 hours** ✅✅

#### Mode 4: Maximum Power Saving (Offline)
```
Pi Zero (WiFi disabled): 0.4W
CJMCU-1293:              0.015W
OLED (off):              0.001W
LEDs (off):              0.000W
─────────────────────────────
Subtotal:                0.416W
PowerBoost loss (15%):   +0.074W
─────────────────────────────
Total:                   0.49W
```

**Runtime**: 18.5Wh ÷ 0.49W = **37.8 hours** 🚀

### Summary Table

| Mode | WiFi | Display | Runtime | Use Case |
|------|------|---------|---------|----------|
| **1. Active Stream** | Continuous | On | 8 hrs | High-data scenarios |
| **2. Periodic** | Every 5 min | On | 24 hrs | Normal use ✅ |
| **3. Optimized** | Every 5 min | Sleep | 24+ hrs | Battery conscious |
| **4. Offline** | Off | Off | 38+ hrs | Emergency/travel |

---

## Charging System

### PowerBoost 1000 Charger Specifications

**Input (Charging):**
- Connector: micro-USB (5V)
- Charging current: 1000mA (1A)
- Charging time: ~6 hours (5000mAh ÷ 1000mA × 1.2 overhead)
- Input protection: Over-voltage, reverse polarity

**Output (Device Power):**
- Voltage: 5.2V (USB standard)
- Current: 1000mA continuous, 1500mA peak (3 seconds)
- Efficiency: ~85%
- Ripple: <50mV

**Features:**
- Load sharing: Can use device while charging ✅
- Power path management: Automatic switching
- Battery indicator LED: Low battery warning
- Charging indicator LED: Status feedback
- Enable pin: Software control (optional)

### Charging Connector Placement

```
Side View of Device:

    ┌──────────────────────────┐
    │                          │
    │  [OLED]    Components    │
    │                          │
    ├──────────────────────────┤
    │      Battery Layer       │
    └──────────[µUSB]──────────┘
                 ↑
        micro-USB charging port
        (sealed with rubber plug)
```

**Location**: Bottom or side edge
**Protection**: Rubber plug cover (splash-resistant)
**Type**: micro-USB (ubiquitous cables)
**Alternative**: USB-C (more modern, but bulkier)

### Charging Procedure

1. **Plug in charger** (5V 1A USB adapter)
2. **Red LED** illuminates (charging)
3. **Wait 6-7 hours** (0% → 100%)
4. **Red LED** turns off (charge complete)
5. **Unplug** and seal port cover

**Charging Stages:**
```
    4.2V ┤        ┌──────────── ← Constant Voltage (CV)
         │       ╱
         │      ╱
         │     ╱
         │    ╱
         │   ╱
         │  ╱
    3.7V ┤ ╱  ← Constant Current (CC)
         │╱
         └────────────────────────────
         0h      2h      4h      6h
```

1. **CC Phase (0-80%)**: Charges at 1A constant (fast)
2. **CV Phase (80-100%)**: Voltage held at 4.2V, current tapers (slow)
3. **Trickle**: Maintains 4.2V with minimal current

---

## Battery Monitoring

### Voltage-Based Fuel Gauge

Since we don't have a dedicated fuel gauge IC, we'll use voltage monitoring:

```python
# Battery voltage to percentage mapping (LiPo discharge curve)
BATTERY_CURVE = {
    4.20: 100,  # Fully charged
    4.10: 95,
    4.00: 85,
    3.90: 75,
    3.80: 60,
    3.70: 40,   # Nominal
    3.60: 25,
    3.50: 15,
    3.40: 5,
    3.00: 0     # Depleted (cutoff)
}

def get_battery_percentage(voltage):
    """Convert battery voltage to percentage"""
    if voltage >= 4.20:
        return 100
    if voltage <= 3.00:
        return 0

    # Linear interpolation between points
    for v_high in sorted(BATTERY_CURVE.keys()):
        if voltage <= v_high:
            v_low = [k for k in BATTERY_CURVE.keys() if k < v_high][-1]
            pct_high = BATTERY_CURVE[v_high]
            pct_low = BATTERY_CURVE[v_low]

            # Interpolate
            ratio = (voltage - v_low) / (v_high - v_low)
            return int(pct_low + ratio * (pct_high - pct_low))

    return 0
```

### Voltage Measurement Methods

#### Option 1: PowerBoost LBO Pin (Simple)
```python
import RPi.GPIO as GPIO

LBO_PIN = 17  # Low Battery Output pin

GPIO.setmode(GPIO.BCM)
GPIO.setup(LBO_PIN, GPIO.IN)

def is_battery_low():
    """Check if battery is below ~3.2V"""
    return GPIO.input(LBO_PIN) == GPIO.LOW
```

**Pros**: Simple, no ADC needed
**Cons**: Only binary (low/not low), no percentage

#### Option 2: Voltage Divider + ADC (Accurate)
```
Battery+ (4.2V max) ──┬── 10kΩ ──┬── ADC Input (3.3V max)
                      │          │
                      │          └── 10kΩ ──┬── GND
                      │                      │
                      └────────────────────────┘
                           Voltage Divider (÷2)
```

Use external ADC like **ADS1115** (16-bit, I2C):

```python
import board
import busio
import adafruit_ads1x15.ads1115 as ADS
from adafruit_ads1x15.analog_in import AnalogIn

# Initialize I2C and ADC
i2c = busio.I2C(board.SCL, board.SDA)
ads = ADS.ADS1115(i2c)
chan = AnalogIn(ads, ADS.P0)

def get_battery_voltage():
    """Read battery voltage via ADC"""
    # Read ADC (0-3.3V)
    adc_voltage = chan.voltage
    # Multiply by 2 (voltage divider ratio)
    battery_voltage = adc_voltage * 2.0
    return battery_voltage

def get_battery_percentage():
    """Get battery percentage"""
    voltage = get_battery_voltage()
    return voltage_to_percentage(voltage)
```

**Pros**: Accurate percentage, real-time monitoring
**Cons**: Requires extra ADC chip (~$5), more complex

### Recommended Approach
Start with **Option 1** (LBO pin) for simplicity.
Upgrade to **Option 2** (ADC) if accurate percentage needed.

---

## Power Management

### Software Power Saving

#### 1. WiFi Management
```python
import os
import subprocess

def wifi_on():
    """Enable WiFi"""
    os.system("sudo ifconfig wlan0 up")

def wifi_off():
    """Disable WiFi (saves ~300mW)"""
    os.system("sudo ifconfig wlan0 down")

def wifi_periodic(interval=300):
    """Turn WiFi on every 'interval' seconds"""
    import time

    while True:
        wifi_on()
        time.sleep(10)  # Upload data for 10 seconds
        wifi_off()
        time.sleep(interval - 10)  # Sleep for remaining time
```

#### 2. Display Dimming
```python
import adafruit_ssd1306

def set_display_brightness(level):
    """
    Set display brightness
    level: 0-255 (0=off, 255=brightest)
    """
    display.contrast(level)

# Auto-dim after timeout
import time

last_activity = time.time()
DIM_TIMEOUT = 30  # seconds

def check_auto_dim():
    global last_activity

    if time.time() - last_activity > DIM_TIMEOUT:
        set_display_brightness(25)  # 10% brightness
    else:
        set_display_brightness(255)  # 100% brightness

def activity_detected():
    """Call this on any interaction"""
    global last_activity
    last_activity = time.time()
    set_display_brightness(255)
```

#### 3. CPU Throttling
```python
# Reduce CPU frequency when idle (saves ~100mW)
def set_cpu_governor(mode):
    """
    mode: 'performance', 'powersave', 'ondemand'
    """
    os.system(f"echo {mode} | sudo tee /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor")

# Use 'powersave' when idle
set_cpu_governor('powersave')

# Switch to 'ondemand' during processing
set_cpu_governor('ondemand')
```

#### 4. Disable Unused Peripherals
```bash
# In /boot/config.txt, disable HDMI, Bluetooth (if not used)

# Disable HDMI (saves ~25mW)
/usr/bin/tvservice -off

# Disable Bluetooth (saves ~30mW)
sudo systemctl disable bluetooth
```

---

## Safety Considerations

### LiPo Battery Safety Rules

⚠️ **CRITICAL SAFETY:**

1. **Never puncture or crush** the battery
2. **Don't short-circuit** terminals
3. **Don't overcharge** (>4.25V) - PCM should prevent this
4. **Don't over-discharge** (<2.75V) - PCM should prevent this
5. **Don't charge unattended** (at least initially)
6. **Keep away from heat** (>60°C can cause fire)
7. **Store at 3.7-3.8V** (50% charge) for long-term
8. **Dispose properly** (don't throw in trash - take to recycling)
9. **Use proper charger** (built-in PowerBoost is safe)
10. **Monitor for swelling** (if battery puffs up, STOP using immediately)

### Fire Safety

- **Never charge near flammable materials**
- **Have fire extinguisher nearby** (Class D for lithium)
- **Use LiPo charging bag** (fire-resistant bag, optional but recommended)
- **Inspect battery regularly** for damage or swelling

### Electrical Safety

- **Double-check polarity** before connecting battery
- **Use proper connectors** (JST-PH, don't solder directly to battery)
- **Insulate exposed wires** (heat shrink tubing)
- **Test with multimeter** before powering on

### Enclosure Safety

- **Ventilation**: Small holes for heat dissipation
- **Non-conductive material**: Plastic, not metal
- **Secure mounting**: Battery shouldn't move around
- **Strain relief**: Wires don't pull on connections

---

## Battery Life Optimization Tips

### For Users:

1. **Reduce WiFi frequency**: Upload every 10 min instead of 5 min
2. **Enable display sleep**: Let screen dim when not looking
3. **Disable LEDs**: Turn off non-essential indicators
4. **Charge regularly**: Don't let battery fully deplete
5. **Proper storage**: Store at 50% charge if not used for weeks

### For Developers:

```python
# Example: Adaptive WiFi based on battery level
def adaptive_wifi_interval():
    battery = get_battery_percentage()

    if battery > 50:
        return 300  # 5 minutes (normal)
    elif battery > 20:
        return 600  # 10 minutes (conserve)
    else:
        return 1800  # 30 minutes (critical)

# Use in main loop
wifi_interval = adaptive_wifi_interval()
```

---

## Alternative Battery Options

### Smaller Capacity (Lighter, Shorter Runtime)

**3000mAh 3.7V LiPo**
- Size: 50mm × 40mm × 6mm
- Weight: ~50g (-30g lighter!)
- Energy: 11.1Wh
- Runtime: ~14 hours (periodic WiFi)
- Cost: ~$12 (-$6)

**Good for**: Day trips, lighter carry

### Larger Capacity (Heavier, Longer Runtime)

**10000mAh 3.7V LiPo**
- Size: 80mm × 60mm × 10mm
- Weight: ~150g (+70g heavier)
- Energy: 37Wh
- Runtime: ~48 hours (periodic WiFi)
- Cost: ~$35 (+$17)

**Good for**: Extended trips, multi-day use

### Replaceable Battery System

```
    ┌──────────────────────────┐
    │                          │
    │     [Main Electronics]   │
    │                          │
    ├──────────────────────────┤
    │  ┌──────────────────┐   │
    │  │                  │   │  ← Removable battery
    │  │   Battery Slot   │◄──┼── Slide lock
    │  │                  │   │
    │  └──────────────────┘   │
    └──────────────────────────┘
```

**Pros:**
- Swap batteries for extended use
- Easy battery replacement when degraded
- Carry spare batteries

**Cons:**
- More complex enclosure design
- Connector reliability
- Slightly larger/heavier

---

## Charging Accessories

### Recommended Chargers

1. **Standard USB Wall Adapter**
   - Output: 5V 1A (or higher)
   - Cost: $5-10
   - Ubiquitous, works everywhere

2. **Portable Power Bank**
   - Capacity: 10,000mAh+ recommended
   - Output: 5V 2A
   - Cost: $20-30
   - Charge device on-the-go

3. **Car Charger**
   - Output: 5V 2A (USB)
   - Cost: $8-15
   - Charge during commute

4. **Solar Charger** (Optional)
   - Power: 10W+ panel
   - Cost: $30-50
   - Emergency/outdoor use

### Cables

- **micro-USB cables**: Keep several (one at home, one in bag, one at work)
- Length: 3-6 feet recommended
- Quality: Use good cables (cheap ones can fail)

---

## Battery Health & Longevity

### Factors Affecting Lifespan

1. **Charge Cycles**: 300-500 full cycles typical (80% capacity remaining)
2. **Depth of Discharge**: Shallow discharges (20-80%) extend life
3. **Temperature**: Cool temps better (avoid >45°C)
4. **Storage**: Store at 3.7V (50%) if unused for >1 month
5. **Charge Rate**: 1A is gentle (faster charging degrades faster)

### Expected Lifespan

- **Heavy use** (daily full cycle): 1-1.5 years
- **Normal use** (partial cycles): 2-3 years
- **Light use** (occasional): 3-5 years

### Signs of Degradation

❌ **Replace battery if:**
- Runtime drops below 50% of original
- Battery swells or puffs up
- Takes much longer to charge
- Gets hot during charging
- Shows physical damage

---

## Emergency Power Features

### Low Battery Warnings

```python
def check_battery_warnings():
    battery_pct = get_battery_percentage()

    if battery_pct < 20:
        # Flash red LED
        flash_led(LED_RED, frequency=1)  # 1 Hz
        # Show warning on display
        display_alert("Low Battery - Charge Soon")

    if battery_pct < 10:
        # Flash faster
        flash_led(LED_RED, frequency=2)  # 2 Hz
        display_alert("CRITICAL BATTERY")

    if battery_pct < 5:
        # Save data and prepare for shutdown
        save_all_data_to_disk()
        display_alert("Saving data...")
        time.sleep(5)
        # Graceful shutdown
        os.system("sudo shutdown -h now")
```

### Data Preservation

```python
# Periodically save buffer to disk (in case of power loss)
import pickle

BUFFER_SAVE_FILE = "/home/pi/ecg_buffer.pkl"

def save_buffer_to_disk(ecg_buffer):
    """Save ECG buffer to disk"""
    with open(BUFFER_SAVE_FILE, 'wb') as f:
        pickle.dump(ecg_buffer, f)

def load_buffer_from_disk():
    """Load ECG buffer from disk on startup"""
    if os.path.exists(BUFFER_SAVE_FILE):
        with open(BUFFER_SAVE_FILE, 'rb') as f:
            return pickle.load(f)
    return []

# Auto-save every 5 minutes
import threading

def auto_save_buffer():
    while True:
        save_buffer_to_disk(current_buffer)
        time.sleep(300)  # 5 minutes

# Start auto-save thread
save_thread = threading.Thread(target=auto_save_buffer, daemon=True)
save_thread.start()
```

---

## Testing & Validation

### Battery Runtime Test Protocol

1. **Full charge** battery to 4.2V
2. **Start monitoring** with typical settings (periodic WiFi)
3. **Record start time**
4. **Log battery voltage** every 30 minutes
5. **Continue until shutdown** (3.0V cutoff)
6. **Record end time**
7. **Calculate actual runtime**
8. **Compare to theoretical** (identify discrepancies)

### Test Results Template

```
Battery Runtime Test - [Date]
─────────────────────────────
Battery: 5000mAh 3.7V LiPo
Mode: Periodic WiFi (every 5 min)
Temperature: 22°C

Time    Voltage  Percentage  Notes
────────────────────────────────────
00:00   4.20V    100%        Full charge
01:00   4.10V    95%         Normal discharge
02:00   4.00V    85%
...
23:00   3.10V    2%          Low battery warning
23:45   3.00V    0%          Shutdown

Total Runtime: 23h 45min
Expected: 24h
Difference: -1.2%
Conclusion: Meets specification ✅
```

---

## Summary

The battery system provides:

✅ **24+ hours runtime** (periodic WiFi mode)
✅ **Safe charging** (PowerBoost with protection)
✅ **Real-time monitoring** (voltage-based fuel gauge)
✅ **Power optimization** (WiFi management, display dimming)
✅ **Emergency features** (low battery warnings, graceful shutdown)

With proper care, the LiPo battery will last 2-3 years before needing replacement!

---

**Last Updated**: 2025-11-06
