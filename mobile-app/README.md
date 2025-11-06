# ECG Monitor - iOS Mobile App

A native iOS mobile application for real-time ECG monitoring and device status tracking. Built with **React Native**, **Expo**, and **TypeScript**.

## Features

### Real-Time Monitoring
- **Live ECG Metrics** - Heart rate, HRV (RMSSD), signal quality
- **3-Lead Waveforms** - Real-time ECG charts for Lead I, II, III
- **Device Status** - Connection status and last update time
- **Auto-Refresh** - Data updates every 5 seconds

### Alerts & Notifications
- **AI-Powered Alerts** - View alerts from Claude AI analysis
- **Severity Levels** - Low, Medium, High, Critical classifications
- **Alert History** - Last 24 hours of alerts
- **Real-time Updates** - New alerts appear automatically

### User Interface
- **Dark Theme** - Eye-friendly dark mode optimized for monitoring
- **Gradient Cards** - Beautiful metric cards with progress indicators
- **Pull to Refresh** - Manual refresh on any screen
- **Tab Navigation** - Easy switching between Dashboard, Alerts, Settings

## Screenshots

### Dashboard
- Live heart rate, HRV, signal quality metrics
- Real-time ECG waveform charts
- Device connection status

### Alerts
- Alert history with severity indicators
- Detailed AI analysis summaries
- Time-based sorting

### Settings
- App information and version
- Device configuration
- GitHub repository link

## Prerequisites

- **macOS** (for iOS development)
- **Node.js** 18+ and npm
- **Xcode** 14+ (for iOS builds)
- **iOS 13+** device or simulator
- **Expo CLI** (will be installed with dependencies)

## Quick Start

### 1. Install Dependencies

```bash
cd mobile-app
npm install
```

### 2. Configure API Endpoint (Optional)

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Edit `.env` to add your API endpoint:

```env
# Leave empty for mock data (development mode)
API_BASE_URL=

# Or set to your API Gateway URL for real data
# API_BASE_URL=https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com
```

### 3. Start Development Server

```bash
npm start
```

This will open the Expo Dev Tools in your browser.

### 4. Run on iPhone

#### Option A: Physical iPhone (Recommended)
1. Install **Expo Go** app from the App Store on your iPhone
2. Scan the QR code from the terminal with your iPhone camera
3. The app will open in Expo Go

#### Option B: iOS Simulator
1. Press `i` in the terminal to open iOS Simulator
2. First time will install Expo Go in the simulator
3. App will launch automatically

### 5. Development Workflow

```bash
# Start development server
npm start

# Run on iOS
npm run ios

# Type check
npm run type-check

# Lint code
npm run lint
```

## Project Structure

```
mobile-app/
├── app/                      # App screens (Expo Router)
│   ├── (tabs)/              # Tab navigation
│   │   ├── index.tsx        # Dashboard screen
│   │   ├── alerts.tsx       # Alerts screen
│   │   ├── settings.tsx     # Settings screen
│   │   └── _layout.tsx      # Tab navigator
│   └── _layout.tsx          # Root layout
├── components/              # Reusable components
│   ├── AlertItem.tsx        # Alert card component
│   ├── ECGChart.tsx         # ECG waveform chart
│   └── MetricCard.tsx       # Metric display card
├── hooks/                   # Custom React hooks
│   └── useECGData.ts        # Data fetching hook
├── services/                # API services
│   └── api.ts               # API client functions
├── types/                   # TypeScript types
│   └── index.ts             # Type definitions
├── constants/               # App constants
│   └── Colors.ts            # Color palette
├── assets/                  # Images and icons
├── app.json                 # Expo configuration
├── package.json             # Dependencies
└── tsconfig.json            # TypeScript config
```

## Configuration

### API Endpoints

The app supports both **mock data** (for development) and **real API** (for production).

**Mock Data Mode** (default):
- No backend required
- Generates realistic ECG waveforms
- Random metric variations
- Sample alerts

**API Mode**:
Set `API_BASE_URL` in `.env` to your API endpoint. Expected endpoints:
- `GET /api/live?device_id={id}` - Live ECG data
- `GET /api/alerts?device_id={id}&hours={h}` - Alert history

### Customization

**Update Interval**:
Edit `useECGData.ts`:
```typescript
const { liveData } = useECGData('device-id', 5000); // 5 seconds
```

**Colors**:
Edit `constants/Colors.ts` to customize the color scheme.

**Device ID**:
Change in `services/api.ts` or pass dynamically.

## Building for Production

### iOS App Store Build

1. **Configure app identifier** in `app.json`:
```json
{
  "ios": {
    "bundleIdentifier": "com.yourcompany.ecgmonitor"
  }
}
```

2. **Install EAS CLI**:
```bash
npm install -g eas-cli
```

3. **Configure EAS Build**:
```bash
eas build:configure
```

4. **Build for iOS**:
```bash
# Build for TestFlight
eas build --platform ios

# Build for App Store
eas build --platform ios --profile production
```

5. **Submit to App Store**:
```bash
eas submit --platform ios
```

### Local iOS Build

```bash
# Install CocoaPods dependencies
cd ios
pod install
cd ..

# Build with Xcode
open ios/*.xcworkspace
```

## Data Flow

1. **useECGData Hook** - Fetches data every 5 seconds
2. **API Service** - Handles API calls with fallback to mock data
3. **Components** - Auto-update when data changes
4. **Charts** - Real-time waveform rendering

## API Integration

### Mock Data (Development)
The app uses realistic mock data by default. Perfect for:
- UI development and testing
- Demo purposes
- When backend is unavailable

### Production API
Connect to your ECG Monitor backend:

1. Set `API_BASE_URL` in `.env`
2. Ensure API endpoints match expected format
3. Handle authentication if required

**Example API Response** (`/api/live`):
```json
{
  "device_id": "ecg-device-001",
  "timestamp": 1234567890,
  "status": "active",
  "metrics": {
    "heart_rate_bpm": 72,
    "hrv_rmssd": 42.5,
    "signal_quality": 0.95
  },
  "waveform": {
    "channel_1": [/* 100 data points */],
    "channel_2": [/* 100 data points */],
    "channel_3": [/* 100 data points */]
  }
}
```

## Troubleshooting

### App won't start
```bash
# Clear cache
npm start -- --clear

# Reinstall dependencies
rm -rf node_modules
npm install
```

### Charts not rendering
- Ensure `react-native-chart-kit` and `react-native-svg` are installed
- Check that waveform data is in correct format

### iOS build fails
```bash
# Clean build
cd ios
rm -rf build
pod install
cd ..
```

### Network errors
- Check your device and development machine are on the same network
- Try using tunnel mode: `npm start -- --tunnel`

## Performance

- **Fast Refresh** - Instant updates during development
- **Optimized Rendering** - Efficient chart updates
- **Low Battery Impact** - Optimized polling intervals
- **Small Bundle** - Minimal dependencies

## Security & Privacy

- All data is fetched from your own backend
- No third-party analytics or tracking
- Secure HTTPS connections
- Local mock data for development

## Medical Disclaimer

⚠️ **Important Notice:**

This is a **personal project**, not a medical device.
- **NOT intended for clinical diagnosis or treatment**
- **NOT FDA approved or CE marked**
- Always consult healthcare professionals for medical decisions
- Use at your own risk

## Technology Stack

- **Framework**: React Native (via Expo)
- **Router**: Expo Router (file-based)
- **Language**: TypeScript
- **Charts**: react-native-chart-kit
- **Gradients**: expo-linear-gradient
- **Storage**: AsyncStorage (for future features)

## Future Enhancements

- [ ] Push notifications for critical alerts
- [ ] Historical data trends
- [ ] Export data to Health app
- [ ] Multiple device support
- [ ] Offline mode with data sync
- [ ] Apple Watch companion app
- [ ] Customizable alert thresholds
- [ ] Dark/Light theme toggle

## Contributing

This is part of the ECG Monitor project. See main repository for contribution guidelines.

## Support

For issues and questions:
1. Check this README
2. Review [Expo Documentation](https://docs.expo.dev/)
3. Open an issue on GitHub

## License

MIT License - See main repository for details

## Acknowledgments

- **Mobile Framework**: Expo & React Native
- **Backend**: ECG Monitor System (AWS + Claude AI)
- **Charts**: react-native-chart-kit
- **Icons**: Native emoji (cross-platform)

## Contact

**Juan Pelaez**
- GitHub: [@23blocks-OS](https://github.com/23blocks-OS)
- Project: [ECG_Monitor](https://github.com/23blocks-OS/ECG_Monitor)

---

Made with ❤️ for better heart health monitoring
