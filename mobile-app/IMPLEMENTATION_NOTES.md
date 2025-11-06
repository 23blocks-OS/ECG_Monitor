# Mobile App Architecture Implementation

## Overview

This document describes the implementation of the mobile app architecture based on the design specifications in `/design/mobile-app/ARCHITECTURE.md`.

## Implemented Features

### 1. Services Layer

#### BLEService (`services/BLEService.ts`)
- Bluetooth Low Energy communication with Raspberry Pi
- Device scanning and pairing
- Auto-reconnection on connection loss
- Chunked data reception and reassembly
- Data decompression (gzip)
- Event-driven callbacks for data reception and connection status

**Key Methods:**
- `scanForDevices()` - Scan for ECG devices
- `connectToDevice()` - Connect to a specific device
- `startDataStream()` - Start receiving ECG data
- `disconnect()` - Disconnect from device
- Event handlers: `onDataReceived()`, `onConnectionLost()`, `onConnectionEstablished()`

#### CloudService (`services/CloudService.ts`)
- AWS IoT MQTT communication (mock implementation for now)
- Batch uploading with compression
- Offline queue management
- Network-aware uploads (WiFi-only mode)
- Automatic retry with exponential backoff
- Alert subscription

**Key Methods:**
- `connect()` - Connect to AWS IoT
- `uploadBatch()` - Upload ECG batch to cloud
- `queueBatchForLater()` - Queue batch for offline upload
- `processOfflineQueue()` - Process queued batches when online
- Event handlers: `onConnectionChanged()`, `onAlert()`

**Note:** The AWS IoT implementation is currently in mock mode. For production:
- Use AWS IoT Core with WebSockets (MQTT over WSS)
- Implement X.509 certificate authentication
- Use AWS Amplify or custom MQTT client

#### StorageService (`services/StorageService.ts`)
- Local data persistence using AsyncStorage
- ECG batch caching (last 7 days)
- Upload queue management
- User settings storage
- Automatic data cleanup
- Storage statistics

**Key Methods:**
- `saveBatch()` / `loadCachedBatches()` - ECG data management
- `queueBatchForUpload()` / `getUploadQueue()` - Upload queue
- `saveSettings()` / `loadSettings()` - Settings persistence
- `clearOldData()` - Cleanup old data
- `getStorageStats()` - Get cache statistics

#### NotificationService (`services/NotificationService.ts`)
- Local push notifications
- Alert notifications with severity levels
- Background notifications for foreground service
- Notification channels (Android)
- Badge management

**Key Methods:**
- `requestPermissions()` - Request notification permissions
- `showNotification()` - Show local notification
- `showAlertNotification()` - Show ECG alert
- `showConnectionNotification()` - Show connection status

### 2. State Management (Redux)

#### ECG Slice (`state/slices/ecgSlice.ts`)
- Current ECG batch
- Live ECG data
- Recent batches buffer (last 10)
- Data receiving status

#### Connection Slice (`state/slices/connectionSlice.ts`)
- BLE connection status
- Cloud connection status
- Device information
- RSSI (signal strength)
- Queue statistics

#### Settings Slice (`state/slices/settingsSlice.ts`)
- User preferences
- BLE device settings
- AWS settings
- Data retention settings
- Notification preferences

### 3. UI Components

#### ConnectionStatus (`components/ConnectionStatus.tsx`)
- Compact and detailed views
- BLE and Cloud status indicators
- Color-coded status badges
- Connection details (device name, RSSI, last sync)

### 4. Updated Screens

#### Dashboard Screen (`app/(tabs)/index.tsx`)
- Integrated BLE service
- Connection status display
- Service initialization on mount
- Auto-connect to last paired device
- Real-time data updates from BLE
- Automatic cloud upload

#### Settings Screen (`app/(tabs)/settings.tsx`)
- Bluetooth device management
  - Device scanning
  - Device list with RSSI
  - Connect/disconnect functionality
- Cloud settings
  - Auto-upload toggle
  - WiFi-only mode
  - AWS region display
- General settings
  - Notifications toggle
  - Data retention display
- Storage management
  - Cache size display
  - Queued batches count
  - Clear cache functionality
  - Process upload queue

### 5. Configuration

#### App Configuration (`app.json`)
- iOS Background Modes:
  - `bluetooth-central` - BLE in background
  - `processing` - Background tasks
  - `fetch` - Background fetch
  - `remote-notification` - Push notifications
- Android Permissions:
  - Bluetooth (BLUETOOTH_SCAN, BLUETOOTH_CONNECT)
  - Location (required for BLE scanning)
  - Foreground service
  - Network access
- Expo Plugins:
  - expo-notifications
  - expo-task-manager
  - expo-background-fetch

## Dependencies

### Added Dependencies
```json
{
  "react-native-ble-plx": "^3.1.2",         // Bluetooth Low Energy
  "aws-iot-device-sdk": "^2.2.13",          // AWS IoT (for future use)
  "@reduxjs/toolkit": "^2.0.1",             // State management
  "react-redux": "^9.0.4",                  // Redux bindings
  "expo-task-manager": "~12.0.0",           // Background tasks
  "expo-background-fetch": "~13.0.0",       // Background fetch
  "expo-notifications": "~0.29.0",          // Notifications
  "expo-device": "~7.0.1",                  // Device info
  "pako": "^2.1.0",                         // Gzip compression
  "@react-native-community/netinfo": "11.4.1" // Network status
}
```

## Installation

1. Install dependencies:
```bash
cd mobile-app
npm install
```

2. For iOS, install pods:
```bash
cd ios
pod install
cd ..
```

3. Run the app:
```bash
# iOS
npm run ios

# Android
npm run android
```

## Architecture Highlights

### Data Flow

1. **BLE → Phone:**
   - Raspberry Pi sends ECG data via Bluetooth
   - BLEService receives and reassembles chunks
   - Data decompressed and parsed
   - Stored in Redux state
   - Saved to local storage

2. **Phone → Cloud:**
   - ECG batch queued for upload
   - CloudService checks network conditions
   - Data compressed and uploaded to AWS
   - Retry on failure with exponential backoff
   - Remove from queue on success

3. **Offline Mode:**
   - Data stored locally in upload queue
   - Automatic upload when connection restored
   - Queue processed in background

### Background Processing

**iOS:**
- Background modes configured in Info.plist
- BLE connection maintained in background
- Background tasks scheduled for data sync

**Android:**
- Foreground service with notification
- BLE connection maintained via service
- Background tasks via WorkManager

### Security Considerations

**Bluetooth:**
- BLE encryption (AES-128)
- Device whitelist via settings
- Automatic disconnection timeout

**Data Storage:**
- AsyncStorage for local data
- Sensitive data should use Keychain/Keystore
- Automatic data cleanup after retention period

**Cloud:**
- HTTPS/TLS for all connections
- AWS IoT certificates (to be implemented)
- No sensitive data in logs

## Known Limitations & Future Work

### Current Limitations

1. **AWS IoT Integration:**
   - Currently in mock mode
   - Need to implement MQTT over WebSockets
   - Certificate authentication pending

2. **Background Processing:**
   - Basic implementation
   - Needs testing on physical devices
   - Battery optimization needed

3. **BLE Implementation:**
   - Assumes specific UUIDs from architecture doc
   - Needs testing with real Raspberry Pi device
   - Chunking protocol needs validation

### Future Enhancements

1. **Phase 2 Features:**
   - Historical data viewer with charts
   - Detailed analysis display
   - Export functionality (PDF/CSV)
   - Push notifications for critical alerts

2. **Phase 3 Features:**
   - Multi-device support
   - Apple Watch companion app
   - Apple Health / Google Fit integration
   - Offline ECG analysis

3. **Optimizations:**
   - Reduce battery consumption
   - Optimize data storage
   - Improve reconnection logic
   - Add data compression levels

4. **Testing:**
   - Unit tests for services
   - Integration tests for data flow
   - E2E tests with mock device
   - Performance testing

## Troubleshooting

### BLE Issues

**Problem:** Can't find devices
- Solution: Check Bluetooth permissions, ensure Location is enabled (Android)

**Problem:** Connection drops frequently
- Solution: Check RSSI, move device closer, check battery level

### Cloud Issues

**Problem:** Batches not uploading
- Solution: Check network connection, verify WiFi-only setting

**Problem:** Large upload queue
- Solution: Process queue manually in Settings, check network stability

### Storage Issues

**Problem:** App storage growing too large
- Solution: Reduce data retention days, clear cache in Settings

## Testing Checklist

- [ ] BLE device scanning works
- [ ] BLE connection and pairing
- [ ] BLE data reception
- [ ] BLE auto-reconnection
- [ ] Cloud upload (when implemented)
- [ ] Offline queue management
- [ ] Local storage persistence
- [ ] Settings save/load
- [ ] Notifications display
- [ ] Background processing (iOS)
- [ ] Foreground service (Android)
- [ ] Connection status updates
- [ ] Data cleanup

## Resources

- [React Native BLE Documentation](https://github.com/dotintent/react-native-ble-plx)
- [AWS IoT SDK](https://github.com/aws/aws-iot-device-sdk-js)
- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [Architecture Design](/design/mobile-app/ARCHITECTURE.md)
