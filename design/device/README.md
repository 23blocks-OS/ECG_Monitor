# Portable ECG Monitor Device Design

> Pocket-sized, battery-powered ECG monitoring device based on Raspberry Pi

## Overview

This folder contains design specifications, component selections, and concepts for creating a truly portable ECG monitoring device. The goal is to create a wearable device that can be carried in a pocket or attached to a belt, providing 24/7 heart monitoring without the bulk of a standard Raspberry Pi setup.

## Design Goals

- **Portability**: Pocket-sized or belt-mountable (target: < 100mm x 70mm x 30mm)
- **Battery Life**: 24+ hours of continuous monitoring on a single charge
- **User Interface**: Small OLED/LCD display for status information
- **Comfort**: Lightweight (target: < 200g with battery)
- **Durability**: Splash-resistant enclosure
- **Connectivity**: WiFi/Bluetooth for data transmission

## Design Concepts

1. **[Concept A - Raspberry Pi Zero Based](concept-a-pi-zero.md)** - Ultra-compact design using Pi Zero 2W
2. **[Concept B - Custom PCB](concept-b-custom.md)** - Dedicated hardware for minimal size
3. **[Concept C - Modular Design](concept-c-modular.md)** - Interchangeable battery/display modules

## Contents

- `components.md` - Detailed component selection and specifications
- `battery-system.md` - Battery sizing, charging, and power management
- `display-interface.md` - Display options and UI design
- `enclosure-design.md` - Case design concepts and 3D printing files
- `bill-of-materials.md` - Complete BOM with pricing
- `assembly-guide.md` - Step-by-step assembly instructions
- `renders/` - Visual concepts and 3D renderings (ASCII art for now!)

## Quick Component Summary

| Component | Selected Option | Rationale |
|-----------|----------------|-----------|
| **Processor** | Raspberry Pi Zero 2W | Compact, WiFi built-in, compatible with existing code |
| **ECG Frontend** | CJMCU-1293 (ADS1293) | Already integrated, proven performance |
| **Battery** | 3.7V 5000mAh LiPo | 24+ hours runtime |
| **Display** | 0.96" OLED 128x64 | Low power, clear visibility |
| **Power Management** | Adafruit PowerBoost 1000C | 5V output, charge management |
| **Enclosure** | Custom 3D printed | Ergonomic, customizable |

## Next Steps

1. [ ] Finalize component selection
2. [ ] Create detailed CAD models for enclosure
3. [ ] Prototype power consumption testing
4. [ ] Design PCB interconnect board
5. [ ] 3D print enclosure prototypes
6. [ ] Software adaptations for battery monitoring
7. [ ] User testing for ergonomics

---

**Status**: Concept Phase
**Last Updated**: 2025-11-06
