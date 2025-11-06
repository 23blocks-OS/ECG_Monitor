# Portable ECG Monitor - Component Selection

Detailed specifications and purchasing information for all components in the portable design.

---

## Core Computing

### Raspberry Pi Zero 2W

**Specifications:**
- CPU: Broadcom BCM2710A1, 1GHz quad-core ARM Cortex-A53 (64-bit)
- RAM: 512MB LPDDR2
- WiFi: 802.11 b/g/n (2.4GHz)
- Bluetooth: 4.2 BLE
- GPIO: 40-pin header (same as larger Pis)
- Video: Mini HDMI (for debugging)
- Power: micro-USB
- Size: 65mm × 30mm × 5mm
- Weight: 12g

**Purchase:**
- Adafruit: $15 (#5291)
- Sparkfun: $15 (DEV-18713)
- PiShop: $15

**Why this choice:**
- Perfect balance of size vs capability
- Built-in WiFi & Bluetooth
- 100% compatible with existing Python code
- Well-supported platform
- Low power compared to Pi 3/4

---

## ECG Frontend

### CJMCU-1293 (Texas Instruments ADS1293)

**Specifications:**
- Channels: 3 (sufficient for standard ECG)
- Resolution: 24-bit ADC
- Sample Rate: Up to 25.6 kSPS
- Input Range: ±4.5V
- Interface: SPI
- Power Supply: 3.3V
- Consumption: ~15mW typical
- Size: ~15mm × 15mm
- Features:
  - Integrated respiration impedance measurement
  - Programmable gain amplifiers
  - Built-in reference
  - Right leg drive (RLD) amplifier
  - Lead-off detection

**Purchase:**
- AliExpress: $20-25 (search "CJMCU-1293")
- eBay: $25-30
- Direct import: $20-25

**Why this choice:**
- Already integrated in your system
- Medical-grade ECG frontend
- Low power consumption
- All necessary features built-in
- Proven performance

**Alternative Options:**
- AD8232: Cheaper (~$5) but single-channel, noisy
- ADS1294: More channels (4) but larger and more expensive
- ADS1299: High-end (8-channel) but overkill for this application

---

## Display

### 0.96" OLED Display (128x64, I2C)

**Specifications:**
- Size: 0.96 inch diagonal
- Resolution: 128×64 pixels
- Driver: SSD1306
- Interface: I2C (4 pins: VCC, GND, SCL, SDA)
- Voltage: 3.3V - 5V
- Colors: White, Blue, or Yellow/Blue
- Viewing Angle: >160°
- Power: ~10mW typical (display on)
- Module Size: ~27mm × 27mm
- Active Area: ~22mm × 11mm

**Purchase:**
- Amazon: $6-8 (various sellers)
- AliExpress: $3-5
- Adafruit: $18 (#326) - premium quality
- Sparkfun: $16 (LCD-13003)

**Why this choice:**
- Very low power consumption
- High contrast (visible in sunlight)
- No backlight needed (OLED)
- Simple I2C interface (only 2 GPIO pins)
- Compact size
- Proven reliability

**Alternative Options:**
- **1.3" OLED (128×64)**: Slightly larger, easier to read (+$2)
- **0.91" OLED (128×32)**: Smaller but less info space (-$1)
- **1.44" TFT LCD (128×128)**: Color but higher power (~50mW) ($8)
- **E-Paper Display (2.13")**: Ultra-low power but slow refresh ($15)

**Recommendation**: Stick with 0.96" OLED for best balance.

---

## Battery System

### LiPo Battery - 5000mAh 3.7V

**Specifications:**
- Capacity: 5000mAh
- Voltage: 3.7V nominal (4.2V max, 3.0V min)
- Energy: 18.5Wh
- Chemistry: Lithium Polymer
- Size: ~60mm × 50mm × 8mm (varies by manufacturer)
- Weight: ~80g
- Connector: JST-PH 2.0mm
- Protection: Built-in PCM (over-charge, over-discharge, short circuit)
- Charge Rate: 1C (5A max, but we'll use 1A)
- Discharge Rate: 2C continuous

**Purchase:**
- Adafruit: $25 (#328 or similar)
- Amazon: $15-20 (EEMB, Talentcell brands)
- HobbyKing: $12-15 (if available in your region)

**Expected Runtime:**
- Active monitoring with WiFi: 12-15 hours
- Periodic WiFi (every 5 min): 18-20 hours
- Optimized sleep mode: 24-30 hours

**Safety Notes:**
⚠️ **IMPORTANT:**
- Never puncture or short-circuit
- Use proper charge controller (see below)
- Don't charge unattended initially
- Dispose properly (don't throw in trash)
- Store at ~50% charge if not used long-term

**Alternative Capacities:**
- **3000mAh**: Smaller/lighter but ~15hr runtime ($12)
- **6600mAh**: Longer life but bulkier (~30hr runtime) ($28)
- **10000mAh**: 40+ hour runtime but heavy/large ($35)

---

### PowerBoost 1000 Charger

**Specifications:**
- Model: Adafruit PowerBoost 1000 Charger
- Input: 3.7V LiPo battery
- Output: 5.2V @ 1A continuous (1.5A peak)
- Efficiency: ~85%
- Charger: 1A (charges 5000mAh in ~6 hours)
- Charging Input: 5V micro-USB
- Features:
  - Built-in load sharing (use while charging)
  - Low battery indicator (LED)
  - Charging indicator (LED)
  - Enable pin (for power control)
  - Power-path management
- Size: 36mm × 23mm × 8mm
- Weight: 6g

**Purchase:**
- Adafruit: $20 (#2465)
- Digikey: $20
- Mouser: $20

**Why this choice:**
- Integrated charge controller + boost converter
- Safe charging with protection
- Can use device while charging
- Status LEDs included
- Proven reliability
- Perfect for Raspberry Pi

**Alternative:**
- **PowerBoost 1000 Basic**: No charger ($15) - need separate charging circuit
- **PowerBoost 500**: Only 0.5A output - not enough for Pi Zero under load ($15)
- **Generic boost converters**: Cheaper ($5) but no protection/charging
- **UPS HAT modules**: All-in-one but larger ($25-35)

---

## Connectors & Cables

### ECG Electrode Connectors

**3.5mm Snap Connectors (3× required)**

**Specifications:**
- Type: Female snap connector
- Size: 3.5mm (standard medical electrode size)
- Contact: Nickel or gold-plated
- Wire: 24-26 AWG flexible silicone
- Length: 60cm (allows routing flexibility)
- Colors: Red (RA), Yellow (LA), Green (LL)

**Purchase:**
- Amazon: $8-12 for set of 3 wires
- eBay: $5-8
- AliExpress: $3-5
- Medical supply: $15-20

**Alternative:**
- **3.5mm snap to clip**: Can use clip-on electrodes (~$8)
- **2mm snap**: Smaller but less common (~$6)
- **Custom PCB pads**: Direct electrode attachment (advanced)

### Disposable ECG Electrodes

**Specifications:**
- Type: Ag/AgCl (silver/silver chloride)
- Size: 30mm × 40mm (standard adult)
- Adhesive: Medical-grade hydrogel
- Connector: 3.5mm male snap
- Quantity: ~30 uses per 50-pack

**Purchase:**
- Amazon: $15-20 for 50 electrodes
- Medical supply: $20-30
- AliExpress: $10-15

---

## Status Indicators

### LEDs (3×)

**Power LED (Blue):**
- Size: 3mm or 5mm
- Color: Blue
- Resistor: 470Ω

**Activity LED (Green):**
- Size: 3mm or 5mm
- Color: Green
- Resistor: 470Ω

**Battery Low LED (Red):**
- Size: 3mm or 5mm
- Color: Red
- Resistor: 470Ω

**Purchase:**
- Amazon: $6 for 200pc assortment
- Digikey: $0.20 each
- Sparkfun: $0.45 each

---

## Power Switch

**Slide Switch**

**Specifications:**
- Type: SPDT (single pole, double throw)
- Rating: 1A @ 5V
- Size: 12mm × 4mm
- Mounting: Through-hole or surface mount

**Purchase:**
- Amazon: $5 for 20pc
- Digikey: $0.50 each (CnK SS12D00G3)
- Adafruit: $2 (#805)

---

## Enclosure

### 3D Printed Case

**Material Options:**

1. **PLA (Recommended for prototyping)**
   - Cost: ~$5 material
   - Pros: Easy to print, rigid, cheap
   - Cons: Not very durable, sensitive to heat
   - Print Time: 6-8 hours

2. **PETG (Recommended for final)**
   - Cost: ~$7 material
   - Pros: Strong, impact-resistant, some flexibility
   - Cons: Slightly harder to print
   - Print Time: 7-9 hours

3. **ABS**
   - Cost: ~$6 material
   - Pros: Very durable, heat resistant
   - Cons: Requires heated enclosure, warping issues
   - Print Time: 7-9 hours

4. **TPU (for grip areas)**
   - Cost: ~$10 material
   - Pros: Flexible, grippy, shock absorbing
   - Cons: Slow print, only for specific parts
   - Use: Bumpers, clips

**3D Printing Service Options:**
- **Shapeways**: $25-40 (professional finish)
- **Craftcloud**: $15-30 (compare multiple services)
- **Local makerspace**: $5-10 (DIY)
- **Own printer**: $2-5 material cost

**Dimensions:**
- External: 85mm × 65mm × 28mm
- Wall thickness: 2.5mm
- Mounting holes: M3 threaded inserts
- Split: Horizontal (top + bottom)

---

## Fasteners & Hardware

### Screws (6× M3 × 8mm)
- Type: Phillips or hex socket
- Material: Stainless steel
- Purchase: McMaster, Amazon ($5 for 50pc)

### Threaded Inserts (6× M3 × 5mm)
- Type: Heat-set brass inserts
- Size: M3 × 5mm × 4.5mm OD
- Purchase: Amazon ($8 for 50pc)

### Rubber Feet (4×)
- Type: Adhesive backed
- Size: 8mm diameter × 2mm height
- Purchase: Amazon ($5 for 100pc)

### Belt Clip
- Type: Universal plastic clip or metal spring clip
- Purchase: Amazon ($8 for 10pc)

---

## Custom PCB

### Interconnect Board

**Specifications:**
- Size: 70mm × 60mm
- Layers: 2 (sufficient for this design)
- Copper: 1oz (standard)
- Finish: ENIG (gold) preferred for connectors
- Soldermask: Green (or black for stealth look)
- Silkscreen: White component labels

**Purchase:**
- JLCPCB: $2 for 5 boards + $8 shipping = $10 total
- PCBWay: $5 for 5 boards + $8 shipping = $13 total
- OSH Park: $25 for 3 boards (US-made, premium)

**Design Files:** Will be created in KiCad (free, open-source)

---

## Miscellaneous

### Wire & Connectors
- **Jumper wires**: Female-female, male-female ($5)
- **Stranded wire 24AWG**: Red/black for power ($6)
- **Heat shrink tubing**: Various sizes ($7)
- **JST connectors**: For battery connection ($8)

### Tools Required
- Soldering iron (temperature controlled)
- Solder (lead-free recommended)
- Wire strippers
- Small Phillips screwdriver
- Multimeter
- Hot glue gun (optional, for strain relief)

---

## Complete Bill of Materials

| # | Component | Qty | Unit Price | Total | Source |
|---|-----------|-----|------------|-------|--------|
| 1 | Raspberry Pi Zero 2W | 1 | $15.00 | $15.00 | Adafruit |
| 2 | CJMCU-1293 ECG Module | 1 | $25.00 | $25.00 | AliExpress |
| 3 | 5000mAh LiPo Battery | 1 | $18.00 | $18.00 | Amazon |
| 4 | PowerBoost 1000 Charger | 1 | $20.00 | $20.00 | Adafruit |
| 5 | 0.96" OLED Display | 1 | $7.00 | $7.00 | Amazon |
| 6 | Custom Interconnect PCB | 1 | $2.00 | $10.00 | JLCPCB (5pcs) |
| 7 | 3D Printed Enclosure | 1 | $5.00 | $5.00 | DIY |
| 8 | ECG Electrode Wires (3×) | 1 set | $8.00 | $8.00 | Amazon |
| 9 | Disposable Electrodes (50×) | 1 pack | $18.00 | $18.00 | Amazon |
| 10 | Status LEDs (3×) | 1 set | $1.00 | $1.00 | Amazon |
| 11 | Slide Switch | 1 | $0.50 | $0.50 | Digikey |
| 12 | M3 Screws & Inserts | 1 set | $3.00 | $3.00 | Amazon |
| 13 | Belt Clip | 1 | $2.00 | $2.00 | Amazon |
| 14 | Resistors, Wire, Misc | - | - | $5.00 | Digikey |
| 15 | Rubber Feet | 4 | $0.20 | $1.00 | Amazon |
| | | | **Total:** | **$138.50** | |

**Bulk Discounts:**
- If building 5 units: ~$110/unit (PCBs, 3D prints amortized)
- If building 10 units: ~$100/unit

**One-time Tools** (if needed):
- Soldering iron kit: $30
- Multimeter: $20
- Wire stripper: $10
- Total: $60

---

## Purchasing Strategy

### Phase 1 - Proof of Concept (Breadboard)
*Test functionality before committing to full build*
- ✓ Pi Zero 2W
- ✓ CJMCU-1293 (already have)
- ✓ OLED display
- ✓ PowerBoost + battery (test power consumption)
- ✓ Breadboard, jumper wires

**Cost**: ~$60

### Phase 2 - First Prototype
*Once POC works, build first integrated unit*
- ✓ Order custom PCB
- ✓ 3D print enclosure
- ✓ All connectors, LEDs, switch
- ✓ Assemble complete device

**Cost**: +$40 (assuming POC parts reused)

### Phase 3 - Refined Production Unit
*After testing first prototype*
- ✓ PCB v2 (with any fixes)
- ✓ Enclosure v2 (ergonomic improvements)
- ✓ Better finish (paint, coatings)
- ✓ Optional: injection-molded case (if making multiple)

**Cost**: ~$20-50 (improvements only)

---

## Sourcing Timeline

| Source | Shipping Time | Notes |
|--------|---------------|-------|
| Amazon (US) | 2-3 days | Prime shipping |
| Adafruit (US) | 3-5 days | Flat $10 shipping |
| Digikey (US) | 2-4 days | Free over $50 |
| AliExpress (China) | 2-4 weeks | Free but slow |
| JLCPCB (China) | 1-2 weeks | DHL available |
| eBay | 1-3 weeks | Variable |

**Total Time to Prototype**: 3-4 weeks (waiting for slowest parts)

---

## Quality & Safety Standards

### Certifications (for reference, not required for personal use)
- **UL/CE**: Not required for DIY personal device
- **Medical Device**: Not classified as medical (personal research only)
- **FCC Part 15**: Raspberry Pi is already certified
- **RoHS**: Use lead-free solder and compliant components

### Safety Considerations
- ✓ LiPo battery protection circuit (built-in to PowerBoost)
- ✓ Strain relief for all cables
- ✓ No sharp edges on enclosure
- ✓ Electrical isolation from body (ECG frontend provides this)
- ✓ Proper ventilation for heat dissipation
- ✓ Status indicators for battery low warning

---

**Next Steps:**
1. Order Phase 1 components for POC
2. Test power consumption and battery life
3. Verify OLED display with Python code
4. Design PCB schematic in KiCad
5. Create 3D model of enclosure

**Last Updated**: 2025-11-06
