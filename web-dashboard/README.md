# Enhanced ECG Monitor Dashboard

A modern, sophisticated web dashboard for real-time ECG monitoring featuring glassmorphism effects, smooth GSAP animations, and Tailwind CSS styling.

## Features

### Visual Design
- **Tailwind CSS**: Modern utility-first CSS framework for rapid UI development
- **Glassmorphism Effects**: Frosted glass effect with backdrop blur on all cards
- **Gradient Mesh Background**: Dynamic multi-layered gradient background with animated particles
- **Custom Color Palette**: Purple, cyan, and pink accent colors throughout

### Animations & Interactions
- **GSAP Animations**:
  - Smooth page load animations with staggered card appearances
  - Metric value update animations with scale and glow effects
  - Particle background with floating animation
  - Status indicator pulse animations
  - Alert slide-in animations with severity-based effects

- **Micro-interactions**:
  - Hover effects on metric cards with elevation and shadow
  - Ripple effects on clickable elements
  - Smooth transitions on all interactive elements
  - Button hover animations with scale and background changes

### Dashboard Components

#### 1. Header
- Animated ECG heartbeat logo with gradient stroke
- Real-time connection status indicator with pulse animation
- Responsive layout for mobile and desktop

#### 2. Metrics Cards
- **Heart Rate**: Red/pink gradient with heart icon
- **HRV (RMSSD)**: Purple/indigo gradient with chart icon
- **Signal Quality**: Cyan/blue gradient with bar chart icon
- **Device Status**: Green/emerald gradient with checkmark icon
- Progress bars showing relative metric levels
- Smooth value update animations

#### 3. ECG Waveform Charts
- Three lead display (Lead I, II, III)
- Custom gradient fills (purple, cyan, pink)
- Dark theme optimized
- Real-time data visualization with Chart.js
- Smooth cubic interpolation

#### 4. Alerts Section
- Severity-based color coding:
  - **Low**: Green
  - **Medium**: Yellow
  - **High**: Orange
  - **Critical**: Red
- Icon badges for each severity level
- Timestamp with human-readable format
- Staggered animation on load
- Click ripple effects

## File Structure

```
web-dashboard/
├── index.html              # Main HTML with Tailwind classes
├── css/
│   └── styles.css          # Legacy styles (can be deprecated)
└── js/
    ├── animations.js       # GSAP animation controller
    ├── app.js             # Main application logic
    ├── ecg-chart.js       # Chart.js ECG waveform manager
    ├── alerts.js          # Alert management with animations
    └── api-client.js      # API client for backend communication
```

## Technologies Used

- **Tailwind CSS 3.x**: Utility-first CSS framework (via CDN)
- **GSAP 3.12**: Professional-grade animation library
- **Chart.js 4.4**: Canvas-based charting library
- **Vanilla JavaScript**: No framework dependencies

## Features in Detail

### Glassmorphism Effect
```css
.glass-effect {
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.18);
}
```

### Gradient Mesh Background
Multi-layered radial gradients creating depth:
- Purple gradient (top-left)
- Blue gradient (top-right)
- Pink gradient (bottom-left)
- Cyan gradient (bottom-right)

### Animation Controller Features
- **50 floating particles** in the background
- **Smooth page load** with timeline-based animations
- **Mutation observers** for automatic value change animations
- **Hover effect system** for interactive elements
- **Status pulse** for connection indicator
- **Alert animations** with severity-based attention-grabbing effects

## Performance Optimizations

- CSS animations use `transform` and `opacity` for GPU acceleration
- Chart.js animations disabled for real-time updates
- Particle system uses GSAP for efficient animation
- Throttled API polling (5 second intervals)
- Page visibility API to pause updates when hidden

## Responsive Design

- Mobile-first approach with Tailwind breakpoints
- Flexbox and Grid layouts
- Collapsible navigation on mobile
- Touch-friendly interactive elements
- Responsive typography scaling

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Modern browsers with CSS backdrop-filter support

## Future Enhancements

- [ ] Dark/light mode toggle
- [ ] Customizable alert thresholds
- [ ] Export data functionality
- [ ] Historical data views with date range picker
- [ ] WebSocket support for real-time updates
- [ ] Progressive Web App (PWA) features
- [ ] Accessibility improvements (ARIA labels, keyboard navigation)

## Development

### Local Development
Simply open `index.html` in a modern browser. All dependencies are loaded via CDN.

### API Integration
Configure the API endpoint in `js/api-client.js`:
```javascript
this.baseUrl = 'http://localhost:8000';
```

## License

Part of the ECG Monitor System project.

## Medical Disclaimer

⚠️ **This is NOT a medical device.** Always consult healthcare professionals for medical advice and diagnosis.
