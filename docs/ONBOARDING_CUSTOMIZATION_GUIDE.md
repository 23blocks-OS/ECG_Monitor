# Onboarding Customization Guide

Complete guide to customizing, extending, and analyzing the ECG Monitor onboarding experience.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Customizing Content](#customizing-content)
4. [Adding New Steps](#adding-new-steps)
5. [Styling & Branding](#styling--branding)
6. [Analytics Integration](#analytics-integration)
7. [Context-Based Personalization](#context-based-personalization)
8. [Advanced Use Cases](#advanced-use-cases)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The onboarding system provides a contextual, multi-step journey for first-time users. It features:

- **Context awareness**: Adapts content based on user's deployment scenario
- **Progress tracking**: Saves progress in localStorage
- **Analytics integration**: Built-in tracking for completion rates and drop-off points
- **Fully customizable**: Easy to modify content, steps, and styling

### Key Files

```
dashboard-next/ (or dashboard-org/)
├── types/onboarding.ts                    # TypeScript interfaces
├── lib/onboardingConfig.ts                # Content configuration
├── hooks/
│   ├── useOnboarding.ts                   # State management hook
│   └── useOnboardingAnalytics.ts          # Analytics tracking
└── components/onboarding/
    ├── OnboardingContainer.tsx            # Main orchestrator
    ├── ContextSelection.tsx               # Step 1
    ├── WelcomeStep.tsx                    # Step 2
    ├── ComponentsOverview.tsx             # Step 3
    ├── RequirementsStep.tsx               # Step 4
    ├── SetupGuideStep.tsx                 # Step 5
    └── CompletionStep.tsx                 # Step 6
```

---

## Architecture

### State Management

The `useOnboarding` hook manages all onboarding state:

```typescript
const {
  progress,              // Current onboarding state
  isOnboardingActive,    // Whether onboarding is shown
  setUserContext,        // Set user deployment type
  nextStep,              // Navigate to next step
  previousStep,          // Go back
  skipOnboarding,        // Skip entirely
  completeOnboarding,    // Finish onboarding
  resetOnboarding,       // Restart (for testing)
  progressPercentage,    // 0-100 completion
  currentStepIndex,      // Current step number
  totalSteps             // Total number of steps
} = useOnboarding();
```

### Data Flow

```
User loads app
    ↓
Check localStorage for 'ecg-monitor-onboarding'
    ↓
├─ Found & complete → Show dashboard
└─ Not found → Show onboarding
    ↓
User selects context (self-deployer / managed-user)
    ↓
Filter steps/requirements/content based on context
    ↓
User progresses through steps (tracked in localStorage)
    ↓
Complete onboarding → Show dashboard
```

---

## Customizing Content

### Editing the Mission Statement

Edit `lib/onboardingConfig.ts`:

```typescript
export const onboardingConfig: OnboardingConfig = {
  mission: {
    title: "Your Custom Title",
    subtitle: "Your tagline",
    description: [
      "First paragraph explaining your mission...",
      "Second paragraph with more detail...",
      "Third paragraph about value proposition..."
    ],
    highlights: [
      "Key feature #1",
      "Key feature #2",
      "Key feature #3"
    ]
  },
  // ... rest of config
};
```

### Adding/Modifying Components

Add a new component to the overview:

```typescript
components: [
  {
    id: 'my-new-component',
    name: 'Component Name',
    description: 'Brief description shown on card',
    icon: '🎯',  // Emoji or you can use SVG in the component
    color: 'from-green-500 to-teal-500',  // Tailwind gradient
    details: [
      'Detail point 1',
      'Detail point 2',
      'Detail point 3'
    ]
  },
  // ... existing components
]
```

### Customizing Requirements

Requirements are filtered based on `applicableTo`:

```typescript
requirements: [
  {
    id: 'unique-requirement-id',
    category: 'hardware' | 'software' | 'network' | 'optional',
    title: 'Requirement Name',
    description: 'Detailed description of what's needed',
    applicableTo: ['self-deployer', 'managed-user'],  // Show for both
    icon: '🔧'
  }
]
```

**Categories:**
- `hardware`: Physical components needed
- `software`: Software tools and libraries
- `network`: Network/connectivity requirements
- `optional`: Nice-to-have additions

### Adding Setup Steps

```typescript
setupSteps: [
  {
    id: 'my-custom-step',
    title: 'Do Something Important',
    description: 'Why this step matters',
    applicableTo: ['self-deployer'],  // Only show for certain users
    estimatedTime: '10 minutes',
    substeps: [
      {
        title: 'Substep 1',
        description: 'Detailed instructions...',
        code: `optional code snippet`,  // Optional: shows in code block
        important: true  // Optional: highlights with purple border
      },
      {
        title: 'Substep 2',
        description: 'More instructions...'
      }
    ]
  }
]
```

---

## Adding New Steps

### 1. Update Type Definitions

Add your step to `types/onboarding.ts`:

```typescript
export type OnboardingStep =
  | 'context-selection'
  | 'welcome'
  | 'components-overview'
  | 'requirements'
  | 'setup-guide'
  | 'my-custom-step'  // ← Add your new step
  | 'completion';
```

### 2. Create Step Component

Create `components/onboarding/MyCustomStep.tsx`:

```typescript
'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface Props {
  onNext: () => void;
  onBack: () => void;
}

export default function MyCustomStep({ onNext, onBack }: Props) {
  const contentRef = useRef<HTMLDivElement>(null);

  // Add entrance animation
  useEffect(() => {
    if (contentRef.current) {
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
      );
    }
  }, []);

  return (
    <div ref={contentRef} className="max-w-4xl mx-auto">
      <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-accent-purple via-accent-pink to-accent-cyan bg-clip-text text-transparent">
        My Custom Step
      </h1>

      <p className="text-xl text-slate-300 mb-8">
        Your content here...
      </p>

      {/* Navigation buttons */}
      <div className="flex justify-between items-center">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200 font-medium"
        >
          ← Back
        </button>

        <button
          onClick={onNext}
          className="group relative overflow-hidden px-8 py-3 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-105"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-accent-purple via-accent-pink to-accent-cyan" />
          <span className="relative z-10 flex items-center gap-2">
            Next
            <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
          </span>
        </button>
      </div>
    </div>
  );
}
```

### 3. Register in Container

Edit `components/onboarding/OnboardingContainer.tsx`:

```typescript
import MyCustomStep from './MyCustomStep';

// ... inside renderStep():
const renderStep = () => {
  switch (progress.currentStep) {
    case 'context-selection':
      return <ContextSelection onNext={nextStep} />;
    case 'welcome':
      return <WelcomeStep onNext={nextStep} onBack={previousStep} />;
    // ... existing cases
    case 'my-custom-step':
      return <MyCustomStep onNext={nextStep} onBack={previousStep} />;
    case 'completion':
      return <CompletionStep />;
    default:
      return null;
  }
};
```

### 4. Update Step Order

Edit `hooks/useOnboarding.ts`:

```typescript
const stepOrder: OnboardingStep[] = [
  'context-selection',
  'welcome',
  'components-overview',
  'requirements',
  'my-custom-step',  // ← Add here in desired order
  'setup-guide',
  'completion',
];
```

---

## Styling & Branding

### Design System

The onboarding uses these Tailwind CSS colors (defined in `tailwind.config.ts`):

```javascript
colors: {
  'accent-purple': '#8b5cf6',
  'accent-pink': '#ec4899',
  'accent-cyan': '#06b6d4',
}
```

### Common CSS Classes

**Glassmorphism cards:**
```css
.glass-effect {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

**Gradient text:**
```jsx
<h1 className="bg-gradient-to-r from-accent-purple via-accent-pink to-accent-cyan bg-clip-text text-transparent">
  Gradient Text
</h1>
```

**Hover effects:**
```jsx
<button className="transition-all duration-300 hover:scale-105">
  Button
</button>
```

### Custom Branding

To match your brand colors, update `tailwind.config.ts`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        'accent-purple': '#your-color',
        'accent-pink': '#your-color',
        'accent-cyan': '#your-color',
      }
    }
  }
}
```

---

## Analytics Integration

### Setup Analytics

Initialize your analytics platform in `app/layout.tsx`:

```typescript
import { initializeOnboardingAnalytics } from '@/hooks/useOnboardingAnalytics';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Option 1: Single platform
    initializeOnboardingAnalytics('google');

    // Option 2: Multiple platforms
    initializeOnboardingAnalytics(['google', 'mixpanel', 'amplitude']);
  }, []);

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

### Tracked Events

The system automatically tracks:

| Event | When Fired | Properties |
|-------|------------|------------|
| `onboarding_started` | User sees onboarding for first time | timestamp |
| `context_selected` | User picks self-deployer or managed-user | userContext |
| `step_completed` | User advances to next step | currentStep, completedSteps, progressPercentage |
| `onboarding_skipped` | User clicks "Skip for now" | currentStep, progressPercentage, timeSpent |
| `onboarding_completed` | User finishes all steps | userContext, completedSteps, timeSpent |
| `onboarding_restarted` | User clicks "Guide" button | timestamp |
| `setup_step_expanded` | User expands a setup step | setupStepId |
| `guide_button_clicked` | User clicks Guide in header | timestamp |

### Custom Analytics Adapter

Create your own adapter for custom platforms:

```typescript
// lib/customAnalytics.ts
import { AnalyticsAdapter } from '@/hooks/useOnboardingAnalytics';

export class CustomAnalyticsAdapter implements AnalyticsAdapter {
  track(event: string, properties: Record<string, any>) {
    // Your custom tracking logic
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, properties })
    });
  }

  identify(userId: string, traits?: Record<string, any>) {
    // Your custom user identification
    fetch('/api/analytics/identify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, traits })
    });
  }
}

// In app/layout.tsx
import { OnboardingAnalytics } from '@/hooks/useOnboardingAnalytics';
import { CustomAnalyticsAdapter } from '@/lib/customAnalytics';

useEffect(() => {
  const analytics = OnboardingAnalytics.getInstance();
  analytics.addAdapter(new CustomAnalyticsAdapter());
}, []);
```

### Viewing Analytics Data

#### Google Analytics 4

View in GA4:
1. Navigate to Events in GA4 dashboard
2. Look for events starting with `onboarding_`
3. Create custom reports to analyze:
   - Completion rate: `onboarding_completed / onboarding_started`
   - Drop-off by step: Compare `step_completed` counts by `currentStep`
   - Time to complete: Average `timeSpent` for `onboarding_completed`

#### Mixpanel

Create funnels:
```
onboarding_started
  → context_selected
  → step_completed (welcome)
  → step_completed (components)
  → ...
  → onboarding_completed
```

---

## Context-Based Personalization

### User Contexts

The system supports two contexts:

- **`self-deployer`**: Users building the system from scratch
- **`managed-user`**: Users with ready-to-use access

### Adding New Contexts

1. Update types:

```typescript
// types/onboarding.ts
export type UserContext = 'self-deployer' | 'managed-user' | 'enterprise-admin' | null;
```

2. Add context selection option:

```typescript
// components/onboarding/ContextSelection.tsx
<button onClick={() => handleSelect('enterprise-admin')}>
  {/* Your new context card */}
</button>
```

3. Filter content by new context:

```typescript
// lib/onboardingConfig.ts
requirements: [
  {
    id: 'advanced-feature',
    title: 'Advanced Feature',
    applicableTo: ['enterprise-admin'],  // Only for this context
    // ...
  }
]
```

### Dynamic Content

Show different content based on context:

```typescript
// In any step component
import { useOnboarding } from '@/hooks/useOnboarding';

export default function MyStep() {
  const { progress } = useOnboarding();

  return (
    <div>
      {progress.userContext === 'self-deployer' && (
        <p>Content for self-deployers...</p>
      )}

      {progress.userContext === 'managed-user' && (
        <p>Content for managed users...</p>
      )}
    </div>
  );
}
```

---

## Advanced Use Cases

### Conditional Step Skipping

Skip steps based on user data:

```typescript
// hooks/useOnboarding.ts
const nextStep = useCallback(() => {
  const currentIndex = stepOrder.indexOf(progress.currentStep);

  // Skip components-overview for managed users
  if (progress.currentStep === 'welcome' && progress.userContext === 'managed-user') {
    const skipToIndex = stepOrder.indexOf('requirements');
    const nextStep = stepOrder[skipToIndex];
    // ... set progress to nextStep
  } else {
    // ... normal next step logic
  }
}, [progress]);
```

### Multi-Language Support

Use i18n library (e.g., next-intl):

```typescript
// lib/onboardingConfig.ts
import { useTranslations } from 'next-intl';

export function useOnboardingConfig() {
  const t = useTranslations('onboarding');

  return {
    mission: {
      title: t('mission.title'),
      subtitle: t('mission.subtitle'),
      description: [
        t('mission.description1'),
        t('mission.description2'),
      ],
      // ...
    }
  };
}
```

### A/B Testing

Test different onboarding flows:

```typescript
// hooks/useOnboarding.ts
const [variant] = useState(() => Math.random() > 0.5 ? 'A' : 'B');

useEffect(() => {
  analytics.identify('user-id', { onboardingVariant: variant });
}, []);

// Conditionally show different content based on variant
```

### Gating Features Behind Onboarding

Prevent access until onboarding is complete:

```typescript
// app/page.tsx
import { useOnboarding } from '@/hooks/useOnboarding';

export default function Dashboard() {
  const { progress, isOnboardingActive } = useOnboarding();

  if (isOnboardingActive || !progress.isComplete) {
    return <OnboardingContainer />;
  }

  return <Dashboard />;  // Show main app only after onboarding
}
```

---

## Troubleshooting

### Onboarding Doesn't Show

**Check:**
1. Is `isOnboardingActive` true?
2. Is localStorage data corrupted? Clear it: `localStorage.removeItem('ecg-monitor-onboarding')`
3. Is `OnboardingContainer` imported and rendered?

```typescript
// Debugging
const { isOnboardingActive, progress } = useOnboarding();
console.log('Onboarding active:', isOnboardingActive);
console.log('Progress:', progress);
```

### Animations Not Working

**Check:**
1. Is GSAP installed? `npm install gsap`
2. Are refs properly attached?
3. Check browser console for errors

```typescript
useEffect(() => {
  if (!contentRef.current) {
    console.error('Ref not attached!');
    return;
  }
  // ... animation code
}, []);
```

### Analytics Not Tracking

**Check:**
1. Is analytics initialized? Call `initializeOnboardingAnalytics()` in layout
2. Is the analytics library loaded? Check `window.gtag`, `window.mixpanel`, etc.
3. Check browser console for network errors
4. Verify in development with console adapter:

```typescript
// Development debugging
if (process.env.NODE_ENV === 'development') {
  // Console adapter is automatically added
  // Check console for "[Analytics]" logs
}
```

### localStorage Quota Exceeded

If storing too much data:

```typescript
// Compress progress data
const saveProgress = useCallback((newProgress: OnboardingProgress) => {
  try {
    // Only store essential data
    const minimalProgress = {
      currentStep: newProgress.currentStep,
      completedSteps: newProgress.completedSteps,
      userContext: newProgress.userContext,
      isComplete: newProgress.isComplete,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(minimalProgress));
  } catch (error) {
    console.error('localStorage full:', error);
  }
}, []);
```

### Styling Issues

Common fixes:

```typescript
// Ensure Tailwind is processing onboarding files
// tailwind.config.js
module.exports = {
  content: [
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
    // Make sure onboarding is included:
    './components/onboarding/**/*.{js,ts,jsx,tsx}',
  ],
};
```

---

## Best Practices

### Content

- **Keep it concise**: Users want to get started quickly
- **Use visuals**: Icons, gradients, and diagrams help comprehension
- **Progressive disclosure**: Hide advanced details in expandable sections
- **Context matters**: Show only relevant information per user type

### Performance

- **Lazy load steps**: Only render the current step component
- **Optimize images**: Use appropriate sizes and formats
- **Minimize animations**: Too much motion can be distracting

### Analytics

- **Track drop-off**: Identify where users abandon onboarding
- **Measure time**: Understand how long each step takes
- **A/B test**: Continuously improve completion rates

### Accessibility

- **Keyboard navigation**: Ensure all buttons are keyboard-accessible
- **Screen readers**: Use semantic HTML and ARIA labels
- **Color contrast**: Maintain WCAG AA standards

```typescript
// Example: Accessible button
<button
  onClick={onNext}
  aria-label="Continue to next onboarding step"
  className="..."
>
  Next
</button>
```

---

## Support

For questions or issues:

- **Documentation**: Check this guide and code comments
- **GitHub Issues**: Open an issue with [Onboarding] tag
- **Community Discord**: Ask in #development channel

---

## Changelog

### v1.1.0 (Current)
- Added analytics integration
- Organization dashboard support
- Improved TypeScript types

### v1.0.0
- Initial release
- 6-step onboarding journey
- Context-aware content
- localStorage persistence
