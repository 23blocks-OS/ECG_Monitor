# Display Interface Design - Portable ECG Monitor

## Overview

The portable ECG monitor uses a 0.96" OLED display (128×64 pixels) to show real-time status information. This document details the UI/UX design, screen layouts, and implementation approach.

---

## Display Specifications

- **Size**: 0.96" diagonal
- **Resolution**: 128 pixels wide × 64 pixels tall
- **Driver**: SSD1306 (I2C)
- **Colors**: Monochrome (white on black, or blue)
- **Refresh Rate**: ~30 Hz
- **Interface**: I2C (SCL, SDA)
- **Power**: ~10mW (display on)

---

## Screen Modes

The device cycles through different display modes based on state and user interaction:

### 1. Normal Mode (Default)
Active monitoring with key metrics

### 2. Graph Mode
Real-time ECG waveform visualization

### 3. Alert Mode
Warning/error messages displayed prominently

### 4. Sleep Mode
Dim or blank screen to save power (after 30s inactivity)

### 5. Menu Mode (Optional)
Settings and configuration

---

## Normal Mode Layout

### Primary Screen
```
┌────────────────────────────┐  ← 128 px wide
│ ECG Monitor      [WiFi: ✓] │  Line 1: Title + WiFi status
├────────────────────────────┤
│                            │
│        ♥ 72 BPM            │  Line 3-4: Large heart rate
│                            │
│   Battery: ████▓░ 85%      │  Line 5: Battery bar + %
│   Status: Recording        │  Line 6: Current state
│   Time: 14:32:15           │  Line 7: Current time
│                            │
│   Cloud: ▲ Streaming       │  Line 8: Upload status
└────────────────────────────┘  ← 64 px tall
```

### Visual Elements Detail:

**Line 1: Header (8px height)**
- Left: "ECG Monitor" (6px font)
- Right: WiFi indicator
  - ✓ = Connected
  - ✗ = Disconnected
  - ⟳ = Connecting
  - ⚠ = Error

**Line 3-4: Heart Rate (24px height)**
- Large, bold numbers
- Heart icon (♥) animated (beats with detected pulse)
- Units: "BPM" (beats per minute)
- If no signal: "-- BPM" + warning

**Line 5: Battery (8px height)**
- Graphical bar: ████▓░ (10 segments)
- Numeric percentage: "85%"
- Color (if available):
  - Green: >50%
  - Yellow: 20-50%
  - Red/Flashing: <20%

**Line 6: Status (8px height)**
- Current operating mode:
  - "Recording" - Normal operation
  - "Initializing" - Startup
  - "Error: [msg]" - Problem state
  - "Standby" - Paused/sleeping

**Line 7: Time (8px height)**
- Current time: HH:MM:SS format
- Synced from NTP when WiFi connected
- Falls back to device uptime if no internet

**Line 8: Cloud Status (8px height)**
- Upload indicator:
  - "▲ Streaming" - Active upload
  - "▲ Queued (12)" - Offline buffer count
  - "▲ Idle" - Nothing to send
  - "✗ Failed" - Upload error

---

## Graph Mode Layout

### Real-time ECG Waveform
```
┌────────────────────────────┐
│ ECG - Lead II      72 BPM  │  Header with HR
├────────────────────────────┤
│       ╱╲                   │
│      ╱  ╲                  │  ECG waveform
│     ╱    ╲      ╱╲         │  Last 3 seconds
│────╱──────╲────╱──╲────────│  of data
│                    ╲      ╱│  Scrolls right
│                     ╲    ╱ │  to left
│                      ╲──╱  │
└────────────────────────────┘
```

### Features:
- **Time window**: Last 3 seconds of data
- **Scroll direction**: Right to left (new data on right)
- **Amplitude**: Auto-scaled to fit display
- **Grid**: Subtle background grid (optional)
- **Update rate**: 10 Hz (every 100ms)
- **Sample rate**: 250 Hz (interpolated for display)

### Display Limitations:
- 128 pixels = ~2.5 seconds @ 250 Hz (every 2-3 samples = 1 pixel)
- Not diagnostic quality (use web dashboard for that)
- Useful for quick visual check

---

## Alert Mode Layout

### Critical Alert
```
┌────────────────────────────┐
│ ⚠  ALERT  ⚠                │  Flashing header
├────────────────────────────┤
│                            │
│   Abnormal Rhythm          │  Alert message
│   Detected!                │  (large font)
│                            │
│   Check dashboard for      │  Instructions
│   details                  │
│                            │
│   [Dismiss to continue]    │  User action
└────────────────────────────┘
```

### Alert Types:

1. **Arrhythmia Detected**
   - Icon: ⚠
   - Background: Inverted (black on white)
   - Flash: 1 Hz (on/off)
   - Sound: Beep pattern (optional buzzer)

2. **Battery Low (<10%)**
   - Icon: 🔋
   - Message: "Charge Soon"
   - Flash: 0.5 Hz

3. **Connection Lost**
   - Icon: ✗
   - Message: "WiFi Disconnected"
   - Flash: Steady

4. **Lead Off (Electrode disconnected)**
   - Icon: ⚠
   - Message: "Check Electrodes"
   - Flash: 2 Hz (fast)

5. **Storage Full**
   - Icon: 💾
   - Message: "Memory Full - Upload Data"

---

## Sleep Mode

### Power Saving Display
```
┌────────────────────────────┐
│                            │
│                            │
│          72 BPM            │  Minimal info
│          ████░  85%        │  Dim brightness
│                            │  (10% intensity)
│                            │
│     [Touch to wake]        │  (if touch sensor)
└────────────────────────────┘
```

### Behavior:
- **Trigger**: 30 seconds of no alerts
- **Brightness**: Reduced to 10% (save power)
- **Info**: Only HR + battery
- **Wake conditions**:
  - Any alert
  - WiFi connection change
  - Button press (optional)
  - Touch sensor (optional)

---

## Menu Mode (Optional - Future)

### Settings Menu
```
┌────────────────────────────┐
│ ⚙ Settings                 │
├────────────────────────────┤
│ > Display Brightness       │
│   WiFi Configuration       │
│   Sleep Timeout            │
│   About Device             │
│   Factory Reset            │
└────────────────────────────┘
```

*Note: For initial version, all settings via config file. Menu can be added later.*

---

## Screen Transitions

### Animation Effects
To improve UX, use smooth transitions between modes:

1. **Fade In/Out**: When changing modes
2. **Slide**: Menu navigation
3. **Flash**: Alerts (attention-grabbing)
4. **Pulse**: Heart rate indicator

### Transition Timing:
- Fast: 200ms (mode switches)
- Medium: 500ms (menus)
- Slow: 1000ms (fade to sleep)

---

## Implementation

### Python Libraries

```python
# Display driver
import adafruit_ssd1306
from board import SCL, SDA
import busio

# Graphics
from PIL import Image, ImageDraw, ImageFont

# GPIO for I2C
import RPi.GPIO as GPIO
```

### Initialization Code

```python
# Create I2C interface
i2c = busio.I2C(SCL, SDA)

# Initialize display (128x64)
display = adafruit_ssd1306.SSD1306_I2C(128, 64, i2c)

# Clear display
display.fill(0)
display.show()

# Create blank image for drawing
image = Image.new('1', (display.width, display.height))
draw = ImageDraw.Draw(image)

# Load fonts
font_small = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 10)
font_medium = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 14)
font_large = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 24)
```

### Update Loop Example

```python
import time

def update_display_normal_mode(hr, battery_pct, wifi_connected, status):
    """Update display with current status"""

    # Clear image
    draw.rectangle((0, 0, display.width, display.height), outline=0, fill=0)

    # Header
    draw.text((0, 0), "ECG Monitor", font=font_small, fill=255)
    wifi_icon = "✓" if wifi_connected else "✗"
    draw.text((105, 0), f"[{wifi_icon}]", font=font_small, fill=255)

    # Divider line
    draw.line((0, 10, 128, 10), fill=255)

    # Heart rate (large)
    draw.text((20, 18), f"♥ {hr} BPM", font=font_large, fill=255)

    # Battery bar
    battery_segments = int(battery_pct / 10)  # 0-10 segments
    bar_x = 10
    bar_y = 46
    bar_width = 80
    segment_width = bar_width / 10

    for i in range(battery_segments):
        x = bar_x + i * segment_width
        draw.rectangle((x, bar_y, x + segment_width - 2, bar_y + 6), outline=255, fill=255)

    # Battery percentage text
    draw.text((bar_x + bar_width + 5, bar_y - 1), f"{battery_pct}%", font=font_small, fill=255)

    # Status
    draw.text((0, 54), f"Status: {status}", font=font_small, fill=255)

    # Display image
    display.image(image)
    display.show()

# Main loop
while True:
    # Get current values
    heart_rate = get_heart_rate()  # From ECG processor
    battery = get_battery_level()  # From GPIO/ADC
    wifi = is_wifi_connected()     # From network check
    device_status = get_device_status()

    # Update display
    update_display_normal_mode(heart_rate, battery, wifi, device_status)

    # Update every 2 seconds
    time.sleep(2)
```

### Graph Mode Example

```python
from collections import deque

# Circular buffer for waveform (last 3 seconds @ 250 Hz = 750 samples)
waveform_buffer = deque(maxlen=750)

def update_display_graph_mode(ecg_sample):
    """Show real-time ECG waveform"""

    # Add new sample
    waveform_buffer.append(ecg_sample)

    # Clear image
    draw.rectangle((0, 0, display.width, display.height), outline=0, fill=0)

    # Header
    hr = calculate_hr_from_buffer(waveform_buffer)
    draw.text((0, 0), f"ECG - Lead II", font=font_small, fill=255)
    draw.text((90, 0), f"{hr} BPM", font=font_small, fill=255)
    draw.line((0, 10, 128, 10), fill=255)

    # Plot waveform (128 pixels wide)
    graph_height = 52  # pixels available for graph
    graph_y_offset = 11  # start below header

    # Downsample to fit 128 pixels (750 samples → 128 pixels = ~6 samples/pixel)
    samples_per_pixel = len(waveform_buffer) // 128

    # Normalize amplitude
    min_val = min(waveform_buffer)
    max_val = max(waveform_buffer)
    amplitude = max_val - min_val if max_val != min_val else 1

    for x in range(128):
        # Average samples for this pixel
        start_idx = x * samples_per_pixel
        end_idx = start_idx + samples_per_pixel
        pixel_samples = list(waveform_buffer)[start_idx:end_idx]

        if pixel_samples:
            avg_sample = sum(pixel_samples) / len(pixel_samples)

            # Scale to display height
            y = int((avg_sample - min_val) / amplitude * graph_height)
            y = graph_y_offset + (graph_height - y)  # Invert Y axis

            # Draw pixel
            draw.point((x, y), fill=255)

    # Display
    display.image(image)
    display.show()
```

---

## Power Management

### Display Power Consumption

| Mode | Brightness | Power | Use Case |
|------|------------|-------|----------|
| **Normal** | 100% | ~10mW | Active use |
| **Dim** | 50% | ~5mW | Alert mode |
| **Sleep** | 10% | ~2mW | Idle |
| **Off** | 0% | ~0.5mW | Not recommended (can't see status) |

### Brightness Control

```python
# Set brightness (0-255)
display.contrast(255)  # 100% brightness
display.contrast(128)  # 50% brightness
display.contrast(25)   # 10% brightness (sleep mode)
```

### Auto-Sleep Timer

```python
import time

last_interaction = time.time()
sleep_timeout = 30  # seconds

def check_sleep_mode():
    global last_interaction

    if time.time() - last_interaction > sleep_timeout:
        display.contrast(25)  # Dim display
        # Show minimal info
    else:
        display.contrast(255)  # Full brightness

def wake_display():
    global last_interaction
    last_interaction = time.time()
    display.contrast(255)
```

---

## Hardware Connections

### I2C Wiring

```
OLED Display    →    Raspberry Pi Zero 2W
────────────────────────────────────────
VCC (3.3V)      →    Pin 1 (3.3V)
GND             →    Pin 6 (GND)
SCL             →    Pin 5 (GPIO 3, SCL)
SDA             →    Pin 3 (GPIO 2, SDA)
```

### Enable I2C on Raspberry Pi

```bash
# Enable I2C interface
sudo raspi-config
# Navigate to: Interface Options → I2C → Enable

# Or edit config directly
echo "dtparam=i2c_arm=on" | sudo tee -a /boot/config.txt

# Reboot
sudo reboot

# Verify I2C devices
sudo i2cdetect -y 1
# Should show device at address 0x3C (60) or 0x3D (61)
```

---

## Testing & Debugging

### Test Display

```python
# Test script: test_display.py

import adafruit_ssd1306
from board import SCL, SDA
import busio
from PIL import Image, ImageDraw, ImageFont

# Initialize
i2c = busio.I2C(SCL, SDA)
display = adafruit_ssd1306.SSD1306_I2C(128, 64, i2c)

# Test 1: Fill screen
print("Test 1: Fill screen")
display.fill(255)  # All pixels on
display.show()
input("Press Enter to continue...")

# Test 2: Clear screen
print("Test 2: Clear screen")
display.fill(0)  # All pixels off
display.show()
input("Press Enter to continue...")

# Test 3: Text
print("Test 3: Text")
image = Image.new('1', (128, 64))
draw = ImageDraw.Draw(image)
font = ImageFont.load_default()
draw.text((10, 10), "Hello, ECG!", font=font, fill=255)
display.image(image)
display.show()
input("Press Enter to continue...")

print("Display test complete!")
```

### Common Issues

| Problem | Cause | Solution |
|---------|-------|----------|
| Nothing on display | I2C not enabled | Run `raspi-config` and enable I2C |
| Garbage/random pixels | Wrong I2C address | Try 0x3C or 0x3D in code |
| Display too dim | Low contrast setting | Increase contrast value |
| Slow refresh | Inefficient drawing | Update only changed regions |
| Font missing | Font path wrong | Check `/usr/share/fonts/` path |

---

## Performance Optimization

### Tips for Smooth Display Updates

1. **Update only changed regions**: Don't redraw entire screen each time
2. **Use buffering**: Draw to memory, then push to display once
3. **Limit refresh rate**: 10-30 Hz is plenty (human perception)
4. **Optimize graphics**: Simple shapes, fewer pixels
5. **Font caching**: Load fonts once at startup

### Benchmark

```python
import time

def benchmark_display_update():
    """Measure display update speed"""

    iterations = 100
    start = time.time()

    for i in range(iterations):
        # Simulate full screen update
        draw.rectangle((0, 0, 128, 64), outline=0, fill=0)
        draw.text((0, 0), f"Frame {i}", font=font_small, fill=255)
        display.image(image)
        display.show()

    elapsed = time.time() - start
    fps = iterations / elapsed

    print(f"Average FPS: {fps:.1f}")
    print(f"Time per frame: {(elapsed/iterations)*1000:.1f} ms")

# Typical results:
# Average FPS: 30-40
# Time per frame: 25-33 ms
```

---

## Future Enhancements

### Possible Additions:

1. **Touch sensor**: Wake on touch, menu navigation
2. **Button inputs**: Physical buttons for mode switching
3. **Larger display**: 1.3" or 1.44" for more info
4. **Color display**: Show red alerts, green OK status
5. **Animated icons**: Smooth transitions, better UX
6. **QR code**: Display QR code to quickly open dashboard URL
7. **Graphs**: More detailed waveforms, trends

---

## Summary

The 0.96" OLED display provides essential status information in a compact, low-power package. The interface prioritizes:

✅ **Critical info at-a-glance**: HR, battery, status
✅ **Clear visual hierarchy**: Large numbers, small labels
✅ **Low power consumption**: Sleep modes, efficient updates
✅ **Flexible modes**: Normal, graph, alert, sleep
✅ **Easy implementation**: Python + Pillow library

This display design makes the portable ECG monitor practical and user-friendly!

---

**Last Updated**: 2025-11-06
