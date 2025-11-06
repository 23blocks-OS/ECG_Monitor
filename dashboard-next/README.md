# ECG Monitor Dashboard - Next.js 14

A modern, sophisticated ECG monitoring dashboard built with **Next.js 14**, **React 18**, **TypeScript**, and **Tailwind CSS**.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3.4
- **Animations**: GSAP 3.12 + Framer Motion
- **Charts**: Chart.js 4.4 + react-chartjs-2
- **Build Tool**: Next.js SWC

## Features

### Modern Architecture
- ✅ Next.js 14 App Router for optimal performance
- ✅ Server & Client Components
- ✅ TypeScript for type safety
- ✅ React Server Components where applicable
- ✅ Automatic code splitting

### Visual Design
- 🎨 Glassmorphism effects with backdrop blur
- 🎨 Gradient mesh background with animated particles
- 🎨 Custom Tailwind theme with accent colors
- 🎨 Responsive design (mobile-first)
- 🎨 Dark theme optimized for medical monitoring

### Animations & Interactions
- ⚡ GSAP-powered smooth animations
- ⚡ Page load animations with staggered reveals
- ⚡ Metric card hover effects
- ⚡ Alert slide-in animations
- ⚡ 50 floating background particles
- ⚡ Ripple click effects
- ⚡ Status indicator pulse

### Components

#### Header
- Animated ECG heartbeat logo
- Real-time connection status
- Responsive layout

#### Metric Cards (4)
1. **Heart Rate** - Red/pink gradient with heart icon
2. **HRV (RMSSD)** - Purple/indigo gradient with trend icon
3. **Signal Quality** - Cyan/blue gradient with bar chart icon
4. **Device Status** - Green/emerald gradient with check icon

Each card features:
- Gradient icon badges
- Large, readable values
- Progress bars
- Hover animations
- Auto-updating values

#### ECG Waveform Charts (3)
- Lead I, II, III displays
- Gradient-filled line charts
- Real-time data updates
- Dark theme optimized
- Smooth cubic interpolation

#### Alerts Section
- Severity-based color coding (low, medium, high, critical)
- Icon badges for each severity
- Relative timestamps
- Slide-in animations
- Click ripple effects

## Project Structure

```
dashboard-next/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main dashboard page
│   └── globals.css         # Global styles & Tailwind
├── components/
│   ├── AlertItem.tsx       # Alert card component
│   ├── ECGChart.tsx        # Chart.js wrapper
│   ├── Header.tsx          # Dashboard header
│   ├── MetricCard.tsx      # Metric display card
│   └── ParticlesBackground.tsx  # Animated particles
├── hooks/
│   ├── useAnimations.ts    # GSAP animation hooks
│   └── useECGData.ts       # Data fetching hook
├── lib/
│   └── api.ts              # API client functions
├── types/
│   └── index.ts            # TypeScript type definitions
├── next.config.js          # Next.js configuration
├── tailwind.config.ts      # Tailwind configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies
```

## Getting Started

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

### Environment Variables

Create a `.env.local` file:

```env
# Optional: API endpoint (defaults to mock data)
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Data Flow

1. **useECGData Hook** - Fetches data every 5 seconds
2. **API Client** - Handles data fetching with fallback to mock data
3. **Components** - Automatically update when data changes
4. **GSAP Animations** - Triggered on data updates

## API Integration

The dashboard can connect to a backend API or run with mock data:

### Mock Data Mode (default)
- No backend required
- Simulated ECG waveforms
- Random metric variations
- Sample alerts

### Backend Mode
Set `NEXT_PUBLIC_API_URL` to your API endpoint:

**Expected API Endpoints:**
- `GET /api/live?device_id={id}` - Live ECG data
- `GET /api/alerts?device_id={id}&hours={h}` - Alert history
- `GET /api/history?device_id={id}` - Historical data

## Customization

### Colors
Edit `tailwind.config.ts` to customize accent colors:

```typescript
accent: {
  purple: '#8b5cf6',
  pink: '#ec4899',
  cyan: '#06b6d4',
}
```

### Update Interval
Modify in `useECGData.ts`:

```typescript
const { liveData } = useECGData('device-id', 5000); // 5 seconds
```

### Animations
Customize GSAP animations in `hooks/useAnimations.ts`

## Performance

- ⚡ Fast Refresh with Next.js
- ⚡ Automatic code splitting
- ⚡ SWC minification
- ⚡ Optimized bundle size
- ⚡ 60fps animations via GSAP
- ⚡ Canvas-based charting

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Deployment

### Vercel (Recommended)
```bash
npm run build
vercel deploy
```

### Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

### Static Export
```bash
# Add to next.config.js:
output: 'export'

# Build
npm run build
```

## Development Tips

### Type Safety
- All data types defined in `types/index.ts`
- Strict TypeScript mode enabled
- React 18 types included

### Hot Reload
- Instant updates in dev mode
- CSS changes reflect immediately
- Component state preserved

### Debugging
```bash
# Check TypeScript errors
npm run lint

# Build test
npm run build
```

## Medical Disclaimer

⚠️ **This is NOT a medical device.** This software is for educational and demonstration purposes only. Always consult qualified healthcare professionals for medical advice and diagnosis.

## License

Part of the ECG Monitor System project.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

For issues and questions, please open an issue on the GitHub repository.
