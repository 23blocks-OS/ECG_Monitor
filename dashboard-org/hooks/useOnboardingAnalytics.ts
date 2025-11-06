import { useEffect, useCallback } from 'react';
import { OnboardingStep, UserContext } from '@/types/onboarding';

/**
 * Analytics event types for onboarding
 */
export type OnboardingEvent =
  | 'onboarding_started'
  | 'context_selected'
  | 'step_viewed'
  | 'step_completed'
  | 'onboarding_skipped'
  | 'onboarding_completed'
  | 'onboarding_restarted'
  | 'setup_step_expanded'
  | 'guide_button_clicked';

/**
 * Event properties for analytics
 */
interface OnboardingEventProperties {
  event: OnboardingEvent;
  timestamp: number;
  userContext?: UserContext;
  currentStep?: OnboardingStep;
  completedSteps?: OnboardingStep[];
  progressPercentage?: number;
  timeSpent?: number;
  setupStepId?: string;
}

/**
 * Analytics adapter interface
 * Implement this for your analytics platform (GA, Mixpanel, Amplitude, etc.)
 */
export interface AnalyticsAdapter {
  track(event: string, properties: Record<string, any>): void;
  identify?(userId: string, traits?: Record<string, any>): void;
}

/**
 * Console logger adapter - for development
 */
class ConsoleAnalyticsAdapter implements AnalyticsAdapter {
  track(event: string, properties: Record<string, any>) {
    console.log(`[Analytics] ${event}`, properties);
  }

  identify(userId: string, traits?: Record<string, any>) {
    console.log(`[Analytics] Identify User: ${userId}`, traits);
  }
}

/**
 * Google Analytics 4 adapter
 * Requires gtag to be loaded on the page
 */
class GoogleAnalyticsAdapter implements AnalyticsAdapter {
  track(event: string, properties: Record<string, any>) {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event, properties);
    }
  }
}

/**
 * Mixpanel adapter
 * Requires mixpanel library to be loaded
 */
class MixpanelAdapter implements AnalyticsAdapter {
  track(event: string, properties: Record<string, any>) {
    if (typeof window !== 'undefined' && (window as any).mixpanel) {
      (window as any).mixpanel.track(event, properties);
    }
  }

  identify(userId: string, traits?: Record<string, any>) {
    if (typeof window !== 'undefined' && (window as any).mixpanel) {
      (window as any).mixpanel.identify(userId);
      if (traits) {
        (window as any).mixpanel.people.set(traits);
      }
    }
  }
}

/**
 * Amplitude adapter
 * Requires amplitude library to be loaded
 */
class AmplitudeAdapter implements AnalyticsAdapter {
  track(event: string, properties: Record<string, any>) {
    if (typeof window !== 'undefined' && (window as any).amplitude) {
      (window as any).amplitude.getInstance().logEvent(event, properties);
    }
  }

  identify(userId: string, traits?: Record<string, any>) {
    if (typeof window !== 'undefined' && (window as any).amplitude) {
      (window as any).amplitude.getInstance().setUserId(userId);
      if (traits) {
        (window as any).amplitude.getInstance().setUserProperties(traits);
      }
    }
  }
}

/**
 * Analytics manager singleton
 */
class OnboardingAnalytics {
  private static instance: OnboardingAnalytics;
  private adapters: AnalyticsAdapter[] = [];
  private startTime: number | null = null;

  private constructor() {
    // Initialize with console logger in development
    if (process.env.NODE_ENV === 'development') {
      this.addAdapter(new ConsoleAnalyticsAdapter());
    }
  }

  static getInstance(): OnboardingAnalytics {
    if (!OnboardingAnalytics.instance) {
      OnboardingAnalytics.instance = new OnboardingAnalytics();
    }
    return OnboardingAnalytics.instance;
  }

  addAdapter(adapter: AnalyticsAdapter) {
    this.adapters.push(adapter);
  }

  setStartTime(time: number) {
    this.startTime = time;
  }

  getTimeSpent(): number | undefined {
    return this.startTime ? Date.now() - this.startTime : undefined;
  }

  track(event: OnboardingEvent, properties: Partial<OnboardingEventProperties> = {}) {
    const eventData: OnboardingEventProperties = {
      event,
      timestamp: Date.now(),
      ...properties,
    };

    // Add time spent if available
    if (this.startTime && !properties.timeSpent) {
      eventData.timeSpent = this.getTimeSpent();
    }

    // Track with all adapters
    this.adapters.forEach(adapter => {
      adapter.track(event, eventData);
    });
  }

  identify(userId: string, traits?: Record<string, any>) {
    this.adapters.forEach(adapter => {
      if (adapter.identify) {
        adapter.identify(userId, traits);
      }
    });
  }
}

/**
 * Hook for tracking onboarding analytics
 *
 * Usage:
 * ```tsx
 * const analytics = useOnboardingAnalytics();
 *
 * // Track events
 * analytics.trackOnboardingStarted();
 * analytics.trackContextSelected('self-deployer');
 * analytics.trackStepViewed('welcome', 2);
 * ```
 */
export function useOnboardingAnalytics() {
  const analyticsManager = OnboardingAnalytics.getInstance();

  const trackOnboardingStarted = useCallback(() => {
    analyticsManager.setStartTime(Date.now());
    analyticsManager.track('onboarding_started');
  }, []);

  const trackContextSelected = useCallback((context: UserContext) => {
    analyticsManager.track('context_selected', {
      userContext: context,
    });
  }, []);

  const trackStepViewed = useCallback((step: OnboardingStep, progressPercentage: number) => {
    analyticsManager.track('step_viewed', {
      currentStep: step,
      progressPercentage,
    });
  }, []);

  const trackStepCompleted = useCallback((
    step: OnboardingStep,
    completedSteps: OnboardingStep[],
    progressPercentage: number
  ) => {
    analyticsManager.track('step_completed', {
      currentStep: step,
      completedSteps,
      progressPercentage,
    });
  }, []);

  const trackOnboardingSkipped = useCallback((
    currentStep: OnboardingStep,
    progressPercentage: number
  ) => {
    analyticsManager.track('onboarding_skipped', {
      currentStep,
      progressPercentage,
      timeSpent: analyticsManager.getTimeSpent(),
    });
  }, []);

  const trackOnboardingCompleted = useCallback((
    userContext: UserContext,
    completedSteps: OnboardingStep[]
  ) => {
    analyticsManager.track('onboarding_completed', {
      userContext,
      completedSteps,
      timeSpent: analyticsManager.getTimeSpent(),
    });
  }, []);

  const trackOnboardingRestarted = useCallback(() => {
    analyticsManager.track('onboarding_restarted');
  }, []);

  const trackSetupStepExpanded = useCallback((stepId: string) => {
    analyticsManager.track('setup_step_expanded', {
      setupStepId: stepId,
    });
  }, []);

  const trackGuideButtonClicked = useCallback(() => {
    analyticsManager.track('guide_button_clicked');
  }, []);

  return {
    trackOnboardingStarted,
    trackContextSelected,
    trackStepViewed,
    trackStepCompleted,
    trackOnboardingSkipped,
    trackOnboardingCompleted,
    trackOnboardingRestarted,
    trackSetupStepExpanded,
    trackGuideButtonClicked,
  };
}

/**
 * Initialize analytics adapters
 * Call this once in your app initialization
 *
 * Example:
 * ```tsx
 * // In app/layout.tsx or _app.tsx
 * import { initializeOnboardingAnalytics } from '@/hooks/useOnboardingAnalytics';
 *
 * // Initialize with Google Analytics
 * initializeOnboardingAnalytics('google');
 *
 * // Or initialize with multiple platforms
 * initializeOnboardingAnalytics(['google', 'mixpanel']);
 * ```
 */
export function initializeOnboardingAnalytics(
  platforms: 'google' | 'mixpanel' | 'amplitude' | ('google' | 'mixpanel' | 'amplitude')[]
) {
  const analytics = OnboardingAnalytics.getInstance();
  const platformArray = Array.isArray(platforms) ? platforms : [platforms];

  platformArray.forEach(platform => {
    switch (platform) {
      case 'google':
        analytics.addAdapter(new GoogleAnalyticsAdapter());
        break;
      case 'mixpanel':
        analytics.addAdapter(new MixpanelAdapter());
        break;
      case 'amplitude':
        analytics.addAdapter(new AmplitudeAdapter());
        break;
    }
  });
}

/**
 * Helper hook to auto-track step views
 * Use this in step components to automatically track when they're viewed
 */
export function useTrackStepView(step: OnboardingStep, progressPercentage: number) {
  const { trackStepViewed } = useOnboardingAnalytics();

  useEffect(() => {
    trackStepViewed(step, progressPercentage);
  }, [step, progressPercentage, trackStepViewed]);
}
