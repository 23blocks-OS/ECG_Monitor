# Concept A: Raspberry Pi Zero 2W Based Portable ECG Monitor

## Overview

This design uses a Raspberry Pi Zero 2W as the core processor, maintaining maximum compatibility with the existing codebase while dramatically reducing size and power consumption.

## Specifications

### Dimensions
- **Width**: 85mm
- **Height**: 65mm
- **Depth**: 28mm
- **Weight**: ~180g (with battery)

### Core Components

#### Computing
- **Raspberry Pi Zero 2W**
  - 1GHz quad-core ARM Cortex-A53
  - 512MB RAM
  - Built-in WiFi 802.11n & Bluetooth 4.2
  - 40-pin GPIO header
  - Size: 65mm x 30mm x 5mm
  - Power: ~1.2W typical, 2W peak

#### ECG Frontend
- **CJMCU-1293 (ADS1293)**
  - 3-channel ECG AFE
  - 24-bit ADC
  - SPI interface
  - Size: 15mm x 15mm
  - Power: ~15mW

#### Display
- **0.96" OLED Display (128x64 I2C)**
  - SSD1306 driver
  - White/Blue options
  - Ultra-low power: ~10mW
  - High contrast in all lighting
  - Size: 27mm x 27mm

#### Battery System
- **5000mAh LiPo Battery (3.7V)**
  - Dimensions: 60mm x 50mm x 8mm
  - Weight: ~80g
  - Capacity: 18.5Wh
  - **Runtime**: 24-30 hours continuous

- **Adafruit PowerBoost 1000C**
  - Input: 3.7V LiPo
  - Output: 5V @ 1A
  - Built-in charge controller
  - Size: 36mm x 23mm x 8mm
  - Efficiency: ~85%

#### Additional Components
- **Power switch** (slide or toggle)
- **Charging indicator LED**
- **Status LEDs** (3x: Power, Activity, Battery Low)
- **micro-USB charging port** (external)
- **Electrode connectors** (3x 3.5mm snap connectors)

## Power Budget

| Component | Average Power | Peak Power |
|-----------|---------------|------------|
| Pi Zero 2W | 1.2W | 2.0W |
| CJMCU-1293 | 0.015W | 0.020W |
| OLED Display | 0.010W | 0.015W |
| WiFi Transmission | - | 0.5W |
| **Total Average** | **~1.3W** | **2.5W** |

**Battery Life Calculation:**
- Battery capacity: 5000mAh × 3.7V = 18.5Wh
- Average consumption @ 5V: 1.3W ÷ 0.85 efficiency = 1.53W
- Runtime: 18.5Wh ÷ 1.53W = **~12 hours active WiFi**
- Runtime: 18.5Wh ÷ 1.1W = **~17 hours WiFi periodic** (every 5 min)
- Runtime with sleep optimization: **24-30 hours**

## Display Interface

### Status Information Shown:
```
┌─────────────────────────┐
│ ECG Monitor  [WiFi: ✓]  │
│─────────────────────────│
│                         │
│  ♥ 72 BPM              │
│                         │
│  Battery: ████░  80%    │
│  Status: Recording      │
│  Time: 14:32:15         │
│                         │
│  Data: Streaming ▲      │
│─────────────────────────│
│ Last Alert: None        │
└─────────────────────────┘
```

### Display Modes:
1. **Normal Mode**: HR, battery, status
2. **Graph Mode**: Real-time mini ECG waveform
3. **Alert Mode**: Flash warning messages
4. **Sleep Mode**: Dim/off to save power

## Enclosure Design

### Form Factor: Rounded rectangle with belt clip
```
     Top View:
   ╔═══════════════╗
   ║  [OLED]       ║
   ║               ║
   ║  [LED] [LED]  ║
   ║     [SW]      ║
   ╚═══════════════╝

     Side View:
   ┌───────────────┐
   │  ▓▓▓▓▓▓▓▓▓▓▓  │ ← Display/PCB layer
   │  ░░░░░░░░░░░  │ ← Battery layer
   │  █████████    │ ← Belt clip mount
   └───────────────┘
```

### Features:
- **Top surface**: OLED display, status LEDs, power switch
- **Bottom surface**: Belt clip attachment point, rubber grip pads
- **Side**: micro-USB charging port (sealed with rubber plug)
- **Side**: 3× electrode wire exit points (strain relief)
- **Material**: ABS plastic (3D printed) or injection molded
- **Finish**: Matte texture for grip, medical-grade coatings
- **Water Resistance**: IPX4 (splash resistant)

### Belt Clip Options:
1. **Integrated clip**: Printed with case
2. **Universal clip**: Attaches to 1/4" mount point
3. **Pocket clip**: Similar to phone case clip
4. **Lanyard loop**: For neck/wrist strap

## PCB Interconnect Board

To make assembly clean and reliable, we'll design a custom interconnect PCB:

### PCB Features:
- **Pi Zero 2W socket**: 40-pin header
- **CJMCU-1293 socket**: Direct SPI connection
- **OLED header**: I2C connection
- **PowerBoost connection**: Power input
- **Electrode connectors**: 3× gold-plated snap connectors
- **Status LEDs**: Power, activity, battery low
- **Power switch connection**
- **Size**: 70mm x 60mm (fits enclosure)

### Schematic Overview:
```
[Battery] → [PowerBoost 1000C] → [5V Rail]
                                      ↓
                              [Pi Zero 2W]
                                   ↓ (SPI)
                            [CJMCU-1293] → [Electrode Connectors]
                                   ↓ (I2C)
                            [OLED Display]
```

## Wearability & Ergonomics

### Carrying Options:
1. **Belt Mount**:
   - Clip attaches to belt (1-2" wide)
   - Centered or side-worn
   - Weight: Well balanced

2. **Pocket Carry**:
   - Fits in standard shirt/pants pocket
   - Electrodes route under clothing
   - Minimal bulk

3. **Chest Harness**:
   - Elastic band with device pocket
   - Optimal electrode placement
   - Comfortable for extended wear

4. **Arm Band**:
   - Athletic armband style
   - Good for exercise monitoring
   - Easy display viewing

### Electrode Management:
- **Wire length**: 60cm (allows flexibility)
- **Wire routing**: Clips/guides on clothing
- **Connectors**: 3.5mm snaps (industry standard)
- **Colors**: Red (RA), Yellow (LA), Green (LL) - standard ECG

## Software Adaptations

### New Requirements:
1. **Battery monitoring**: Read battery level from PowerBoost
2. **Display driver**: SSD1306 OLED via I2C
3. **Power management**: Sleep modes, WiFi on/off scheduling
4. **Status indicators**: LED control for different states
5. **Button interface** (optional): Mode switching

### Python Libraries Needed:
```python
# Display
import adafruit_ssd1306
from PIL import Image, ImageDraw, ImageFont

# Battery monitoring
import RPi.GPIO as GPIO

# Power management
import os  # for system sleep commands
```

### Display Update Schedule:
- **Normal**: Update every 2 seconds
- **Low Battery**: Flash warning every 1 second
- **Sleep**: Turn off after 30 seconds of inactivity

## Assembly Complexity

**Skill Level**: Intermediate

### Assembly Steps:
1. Solder headers to Pi Zero 2W
2. Solder components to interconnect PCB
3. Connect PowerBoost to battery (observe polarity!)
4. Mount Pi Zero to interconnect PCB
5. Connect OLED display
6. Mount CJMCU-1293 module
7. Install assembly into enclosure (bottom half)
8. Attach electrode wires to connectors
9. Close enclosure (top half with screws)
10. Attach belt clip
11. Initial power-on and testing

**Estimated Assembly Time**: 2-3 hours for first build

## Cost Estimate

| Component | Cost (USD) | Source |
|-----------|------------|--------|
| Raspberry Pi Zero 2W | $15 | Adafruit/Digikey |
| CJMCU-1293 Module | $25 | AliExpress/eBay |
| 5000mAh LiPo Battery | $15 | Adafruit/Amazon |
| PowerBoost 1000C | $20 | Adafruit |
| 0.96" OLED Display | $8 | Amazon/AliExpress |
| Custom Interconnect PCB | $10 | JLCPCB (5 pcs) |
| 3D Printed Enclosure | $5 | DIY or service |
| Electrode Connectors | $3 | Amazon |
| Status LEDs, Switch, Wires | $5 | DigiKey |
| Fasteners, Clips | $4 | McMaster/Amazon |
| **Total** | **~$110** | |

*Add ~$30 for electrodes if not owned*

## Advantages

✅ **Maximum compatibility** with existing code
✅ **WiFi & Bluetooth built-in**
✅ **Well-documented platform**
✅ **Easy prototyping & debugging**
✅ **Familiar development environment**
✅ **Large community support**
✅ **Good balance of size and capability**

## Limitations

⚠️ **Larger than custom solution** (but still very portable)
⚠️ **Higher power consumption** than dedicated MCU
⚠️ **Battery life** good but not exceptional (24hrs vs 72hrs possible with custom)
⚠️ **Cost** slightly higher due to Pi Zero

## Recommendations

This design is **highly recommended** for:
- **First iteration/prototype**
- **Maintaining code compatibility**
- **Quick development and testing**
- **Users comfortable with Raspberry Pi**

Consider moving to Concept B (custom PCB) for:
- Mass production
- Absolute minimum size
- Maximum battery life
- Lowest cost at scale

## Next Steps

1. [ ] Order components for prototype
2. [ ] Design interconnect PCB in KiCad
3. [ ] Create 3D model of enclosure in FreeCAD/Fusion360
4. [ ] 3D print test enclosure
5. [ ] Assemble prototype
6. [ ] Develop display driver code
7. [ ] Test power consumption
8. [ ] Field test for comfort and usability

---

**Concept Status**: Ready for Prototyping
**Estimated Timeline**: 2-3 weeks from component order to working prototype
