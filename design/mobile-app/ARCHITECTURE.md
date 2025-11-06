# Mobile App Architecture

## Overview

The ECG Monitor mobile app acts as a **relay** between the Raspberry Pi (via Bluetooth) and AWS cloud (via cellular/WiFi). It also provides a local interface for viewing real-time ECG data even when offline.

## Technology Stack

### Framework: React Native
- **Why:** Single codebase for iOS and Android
- **Version:** React Native 0.72+
- **Language:** TypeScript for type safety

### Key Libraries

```json
{
  "react-native": "^0.72.0",
  "react-native-ble-plx": "^3.1.1",      // Bluetooth Low Energy
  "aws-sdk": "^2.1400.0",                // AWS IoT/S3
  "@react-native-async-storage": "^1.19.0",  // Local data persistence
  "react-native-charts-wrapper": "^0.5.11",  // ECG waveform rendering
  "react-native-background-actions": "^3.0.0"  // Background data relay
}
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│ MOBILE APP (iOS/Android)                                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ UI LAYER (React Native)                         │   │
│  ├─────────────────────────────────────────────────┤   │
│  │ - Dashboard Screen (real-time waveform)         │   │
│  │ - History Screen (past recordings)              │   │
│  │ - Settings Screen (Bluetooth pairing)           │   │
│  │ - Alerts Screen (notifications)                 │   │
│  └──────────────────┬──────────────────────────────┘   │
│                     │                                    │
│  ┌─────────────────┴──────────────────────────────┐   │
│  │ STATE MANAGEMENT (Redux/Context)               │   │
│  ├────────────────────────────────────────────────┤   │
│  │ - ECG data buffer (last 30 seconds)            │   │
│  │ - Connection status (BLE + AWS)                │   │
│  │ - User settings                                 │   │
│  └──────────────────┬──────────────────────────────┘   │
│                     │                                    │
│  ┌─────────────────┴──────────────────────────────┐   │
│  │ SERVICES LAYER                                  │   │
│  ├────────────────────────────────────────────────┤   │
│  │                                                  │   │
│  │  BLE Service          Cloud Service             │   │
│  │  ├─ Connect Pi        ├─ AWS IoT MQTT           │   │
│  │  ├─ Receive data      ├─ Upload batches         │   │
│  │  └─ Handle errors     └─ Fetch analysis         │   │
│  │                                                  │   │
│  │  Storage Service      Notification Service      │   │
│  │  ├─ Cache offline     ├─ Show alerts            │   │
│  │  └─ Sync later        └─ Background notify      │   │
│  │                                                  │   │
│  └──────────────────┬──────────────────────────────┘   │
│                     │                                    │
│  ┌─────────────────┴──────────────────────────────┐   │
│  │ BACKGROUND WORKER (Headless JS)                 │   │
│  ├────────────────────────────────────────────────┤   │
│  │ - Maintain BLE connection when app backgrounded │   │
│  │ - Queue data for cloud upload                   │   │
│  │ - Retry failed uploads                          │   │
│  └────────────────────────────────────────────────┘   │
│                                                          │
└───────────┬──────────────────────┬──────────────────────┘
            │                      │
     Bluetooth LE            Cellular/WiFi
            │                      │
        ┌───┴────┐            ┌────┴────┐
        │   Pi   │            │   AWS   │
        └────────┘            └─────────┘
```

## Core Components

### 1. BLE Service (`src/services/BLEService.ts`)

Handles Bluetooth communication with Raspberry Pi:

```typescript
class BLEService {
  // UUIDs matching Pi implementation
  static ECG_SERVICE_UUID = "0000181d-0000-1000-8000-00805f9b34fb"
  static ECG_DATA_CHAR_UUID = "00002a37-0000-1000-8000-00805f9b34fb"

  async scanForDevices(): Promise<Device[]>
  async connectToDevice(deviceId: string): Promise<void>
  async startDataStream(): Promise<void>
  async disconnect(): Promise<void>

  // Event handlers
  onDataReceived(callback: (batch: ECGBatch) => void)
  onConnectionLost(callback: () => void)
}
```

**Key Features:**
- Auto-reconnect when connection drops
- Data chunking/reassembly (BLE MTU limitations)
- Battery-efficient scanning

### 2. Cloud Service (`src/services/CloudService.ts`)

Handles AWS IoT communication:

```typescript
class CloudService {
  private mqttClient: AWSIoTMQTTClient

  async connect(credentials: AWSCredentials): Promise<void>
  async uploadBatch(batch: ECGBatch): Promise<boolean>
  async fetchAnalysis(batchId: string): Promise<Analysis>
  async subscribeToAlerts(callback: (alert: Alert) => void)

  // Offline queue management
  async queueBatchForLater(batch: ECGBatch): Promise<void>
  async processOfflineQueue(): Promise<void>
}
```

**Key Features:**
- Automatic retry with exponential backoff
- Offline queue (stores locally)
- Compression before upload

### 3. Storage Service (`src/services/StorageService.ts`)

Local data persistence:

```typescript
class StorageService {
  async saveBatch(batch: ECGBatch): Promise<void>
  async loadCachedBatches(): Promise<ECGBatch[]>
  async clearOldData(daysToKeep: number): Promise<void>

  async saveSettings(settings: UserSettings): Promise<void>
  async loadSettings(): Promise<UserSettings>
}
```

**Storage Strategy:**
- Keep last 7 days of data locally (~50 MB)
- LRU cache for waveform rendering
- Secure storage for AWS credentials

## Data Flow

### Normal Operation (Online)

```
1. Pi collects ECG samples (250 Hz)
      ↓
2. Pi creates 10-second batch
      ↓
3. Pi sends via Bluetooth → Phone receives
      ↓
4. Phone decompresses batch
      ↓
5. Phone displays real-time waveform
      ↓
6. Phone uploads to AWS IoT (cellular/WiFi)
      ↓
7. Cloud processes & analyzes
      ↓
8. Phone fetches analysis results
      ↓
9. Phone shows alerts if needed
```

### Offline Operation

```
1. Pi → Bluetooth → Phone receives batch
      ↓
2. Phone stores batch locally (AsyncStorage)
      ↓
3. Phone displays real-time waveform (offline mode)
      ↓
4. When connection restored:
   Phone uploads queued batches to AWS
      ↓
5. Fetches pending analysis results
```

### No Phone Connection (Pi Offline Mode)

```
1. Pi collects ECG samples
      ↓
2. Pi caches batches to local SD card (9 days capacity)
      ↓
3. When phone connects:
   Pi sends cached batches via Bluetooth
      ↓
4. Phone relays to AWS
```

## Screen Designs

### Dashboard Screen
```
┌──────────────────────────────────────┐
│  ECG Monitor          [BLE] [Cloud]  │ ← Status indicators
├──────────────────────────────────────┤
│                                       │
│  Channel 1  ~~~~~~~~~/\~~~~          │ ← Real-time waveform
│  Channel 2  ~~~~~~/\/\~~~~~~         │
│  Channel 3  ~~~~/\~~~~~/\~~          │
│                                       │
│  ┌─────────────────────────────┐    │
│  │   Heart Rate                 │    │
│  │       72 BPM                 │    │ ← Key metrics
│  └─────────────────────────────┘    │
│                                       │
│  Signal Quality: ████████░░  92%     │
│  Battery: ████████████░░  85%        │
│                                       │
│  Last Analysis: 2 min ago             │
│  Status: Normal rhythm               │
│                                       │
└──────────────────────────────────────┘
```

### Settings Screen
```
┌──────────────────────────────────────┐
│  ← Settings                           │
├──────────────────────────────────────┤
│                                       │
│  Bluetooth Device                     │
│  ┌────────────────────────────────┐  │
│  │ ECG-Monitor                     │  │
│  │ Connected                      >│  │
│  └────────────────────────────────┘  │
│                                       │
│  [Scan for Devices]                  │
│                                       │
│  ─────────────────────────────────   │
│                                       │
│  Cloud Settings                       │
│  AWS Region: us-east-1               │
│  Auto-upload: ON                     │
│  Use WiFi only: OFF                  │
│                                       │
│  ─────────────────────────────────   │
│                                       │
│  Data Retention                       │
│  Keep local data: 7 days             │
│                                       │
│  Cache size: 42.3 MB                 │
│  [Clear Cache]                       │
│                                       │
└──────────────────────────────────────┘
```

## BLE Protocol Specification

### Data Format

**Batch Header (20 bytes):**
```
┌────────────────┬──────────────┬───────────┬──────────┐
│ Magic (4)      │ Version (2)  │ Length (4)│ CRC (4)  │
│ 0x45434721     │ 0x0001       │ uint32    │ uint32   │
└────────────────┴──────────────┴───────────┴──────────┘
│ Batch ID (8) - Unix timestamp in milliseconds          │
└────────────────────────────────────────────────────────┘
```

**Chunk Format (MTU = 512 bytes):**
```
┌──────────┬──────────┬────────────┬─────────────────┐
│ Seq (2)  │ Total (2)│ Data Len(2)│ Data (506 bytes)│
└──────────┴──────────┴────────────┴─────────────────┘
```

**Data Payload (compressed JSON):**
```json
{
  "batch_id": "1699123456789",
  "device_id": "ecg-device-001",
  "start_timestamp": 1699123456789,
  "duration_seconds": 10,
  "sample_rate": 250,
  "channels": {
    "channel_1": [<2500 samples>],
    "channel_2": [<2500 samples>],
    "channel_3": [<2500 samples>]
  },
  "signal_quality": 0.92,
  "battery_level": 85
}
```

## Background Processing

### iOS (Background Modes)

Required capabilities in `Info.plist`:
```xml
<key>UIBackgroundModes</key>
<array>
  <string>bluetooth-central</string>
  <string>processing</string>
</array>
```

### Android (Foreground Service)

Notification required for background BLE:
```
ECG Monitor Running
Receiving data from device
[Tap to open]
```

## Security Considerations

### Bluetooth Security
- **Pairing:** PIN-based or numeric comparison
- **Encryption:** BLE built-in AES-128
- **Authentication:** Device whitelist

### Cloud Security
- **AWS IoT:** X.509 certificates (embedded in app)
- **TLS 1.2+** for all connections
- **Credentials:** Stored in iOS Keychain / Android Keystore

### Data Privacy
- **PHI Compliance:** HIPAA considerations
- **Encryption at rest:** AsyncStorage encrypted
- **No cloud storage:** Raw ECG deleted after analysis

## Battery Optimization

### Strategies

1. **BLE Optimization:**
   - Use connection interval: 100ms (balance latency/power)
   - Reduce scan duty cycle when connected
   - Use notifications (not indications) for lower power

2. **Network Optimization:**
   - Batch uploads (don't upload every 10s batch immediately)
   - Use WiFi when available
   - Compress data before upload

3. **UI Optimization:**
   - Reduce waveform rendering to 60 FPS
   - Throttle updates when app backgrounded
   - Use native modules for intensive tasks

### Expected Battery Impact

| Scenario | Battery Drain (per hour) |
|----------|--------------------------|
| Active monitoring (screen on) | 15-20% |
| Background relay | 5-8% |
| Idle (paired but not streaming) | 1-2% |

## Development Roadmap

### Phase 1: MVP (2-3 weeks)
- [ ] Basic BLE connection & data reception
- [ ] Real-time waveform display
- [ ] Cloud upload functionality
- [ ] Settings screen

### Phase 2: Polish (1-2 weeks)
- [ ] Background processing
- [ ] Offline queue management
- [ ] Push notifications for alerts
- [ ] Historical data viewer

### Phase 3: Advanced (2-3 weeks)
- [ ] Multi-device support
- [ ] Apple Watch companion app
- [ ] Export data (PDF/CSV)
- [ ] Integration with Apple Health / Google Fit

## Testing Strategy

### Unit Tests
- BLE service (mocked device)
- Cloud service (mocked AWS)
- Storage service
- Data processing

### Integration Tests
- End-to-end data flow (Pi → Phone → Cloud)
- Offline/online transitions
- Reconnection handling

### Device Testing
- iOS: iPhone 12+ (BLE 5.0)
- Android: Pixel 5+ (Android 11+)
- Real Pi hardware testing

## Deployment

### App Store Requirements

**iOS:**
- Privacy manifest (Bluetooth, network usage)
- Health app integration (optional)
- TestFlight beta testing

**Android:**
- Google Play Console
- Permissions: BLUETOOTH, BLUETOOTH_CONNECT, INTERNET
- Location permission (required for BLE scanning on Android 10+)

## File Structure

```
mobile-app/
├── src/
│   ├── screens/
│   │   ├── DashboardScreen.tsx
│   │   ├── HistoryScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   └── AlertsScreen.tsx
│   ├── services/
│   │   ├── BLEService.ts
│   │   ├── CloudService.ts
│   │   ├── StorageService.ts
│   │   └── NotificationService.ts
│   ├── components/
│   │   ├── WaveformChart.tsx
│   │   ├── HeartRateGauge.tsx
│   │   └── ConnectionStatus.tsx
│   ├── state/
│   │   ├── store.ts
│   │   ├── slices/
│   │   │   ├── ecgSlice.ts
│   │   │   ├── connectionSlice.ts
│   │   │   └── settingsSlice.ts
│   ├── types/
│   │   ├── ECGData.ts
│   │   └── API.ts
│   └── utils/
│       ├── compression.ts
│       └── validation.ts
├── ios/
├── android/
├── package.json
└── tsconfig.json
```

## References

- [React Native BLE Documentation](https://github.com/dotintent/react-native-ble-plx)
- [AWS IoT SDK for JavaScript](https://github.com/aws/aws-iot-device-sdk-js)
- [Bluetooth Core Specification](https://www.bluetooth.com/specifications/bluetooth-core-specification/)
