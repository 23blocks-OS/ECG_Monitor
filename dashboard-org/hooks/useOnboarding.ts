import { useState, useEffect, useCallback } from 'react';
import { OnboardingProgress, OnboardingStep, UserContext } from '@/types/onboarding';
import { useOnboardingAnalytics } from './useOnboardingAnalytics';

const STORAGE_KEY = 'ecg-monitor-onboarding';

const initialProgress: OnboardingProgress = {
  currentStep: 'context-selection',
  completedSteps: [],
  userContext: null,
  startedAt: new Date().toISOString(),
  isComplete: false,
  canSkip: true,
};

const stepOrder: OnboardingStep[] = [
  'context-selection',
  'welcome',
  'components-overview',
  'requirements',
  'setup-guide',
  'completion',
];

/**
 * Custom hook for managing onboarding state
 * Handles navigation, progress tracking, and localStorage persistence
 */
export function useOnboarding() {
  const [progress, setProgress] = useState<OnboardingProgress>(initialProgress);
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);
  const analytics = useOnboardingAnalytics();

  // Load progress from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as OnboardingProgress;
        setProgress(parsed);
        setIsOnboardingActive(!parsed.isComplete);
      } else {
        // First time user - show onboarding
        setIsOnboardingActive(true);
        saveProgress(initialProgress);
        analytics.trackOnboardingStarted();
      }
    } catch (error) {
      console.error('Failed to load onboarding progress:', error);
      setIsOnboardingActive(true);
    }
  }, []);

  // Save progress to localStorage
  const saveProgress = useCallback((newProgress: OnboardingProgress) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newProgress));
      setProgress(newProgress);
    } catch (error) {
      console.error('Failed to save onboarding progress:', error);
    }
  }, []);

  // Set user context (self-deployer or managed-user)
  const setUserContext = useCallback((context: UserContext) => {
    analytics.trackContextSelected(context);
    const newProgress = {
      ...progress,
      userContext: context,
      completedSteps: [...progress.completedSteps, 'context-selection' as OnboardingStep],
    };
    saveProgress(newProgress);
  }, [progress, saveProgress, analytics]);

  // Navigate to next step
  const nextStep = useCallback(() => {
    const currentIndex = stepOrder.indexOf(progress.currentStep);
    if (currentIndex < stepOrder.length - 1) {
      const nextStep = stepOrder[currentIndex + 1];
      const newCompletedSteps = [...new Set([...progress.completedSteps, progress.currentStep])];
      const newProgress = {
        ...progress,
        currentStep: nextStep,
        completedSteps: newCompletedSteps,
      };

      // Track step completion
      const progressPercentage = Math.round(
        (stepOrder.indexOf(progress.currentStep) / (stepOrder.length - 1)) * 100
      );
      analytics.trackStepCompleted(progress.currentStep, newCompletedSteps, progressPercentage);

      // Mark as complete when reaching completion step
      if (nextStep === 'completion') {
        newProgress.isComplete = true;
        newProgress.completedAt = new Date().toISOString();
      }

      saveProgress(newProgress);
    }
  }, [progress, saveProgress, analytics]);

  // Navigate to previous step
  const previousStep = useCallback(() => {
    const currentIndex = stepOrder.indexOf(progress.currentStep);
    if (currentIndex > 0) {
      const prevStep = stepOrder[currentIndex - 1];
      const newProgress = {
        ...progress,
        currentStep: prevStep,
      };
      saveProgress(newProgress);
    }
  }, [progress, saveProgress]);

  // Jump to specific step
  const goToStep = useCallback((step: OnboardingStep) => {
    const newProgress = {
      ...progress,
      currentStep: step,
    };
    saveProgress(newProgress);
  }, [progress, saveProgress]);

  // Skip onboarding entirely
  const skipOnboarding = useCallback(() => {
    const progressPercentage = Math.round(
      (stepOrder.indexOf(progress.currentStep) / (stepOrder.length - 1)) * 100
    );
    analytics.trackOnboardingSkipped(progress.currentStep, progressPercentage);

    const newProgress = {
      ...progress,
      currentStep: 'completion' as OnboardingStep,
      isComplete: true,
      completedAt: new Date().toISOString(),
    };
    saveProgress(newProgress);
    setIsOnboardingActive(false);
  }, [progress, saveProgress, analytics]);

  // Complete onboarding
  const completeOnboarding = useCallback(() => {
    analytics.trackOnboardingCompleted(progress.userContext!, stepOrder);

    const newProgress = {
      ...progress,
      currentStep: 'completion' as OnboardingStep,
      completedSteps: stepOrder,
      isComplete: true,
      completedAt: new Date().toISOString(),
    };
    saveProgress(newProgress);
    setIsOnboardingActive(false);
  }, [progress, saveProgress, analytics]);

  // Reset onboarding (for testing or re-onboarding)
  const resetOnboarding = useCallback(() => {
    analytics.trackOnboardingRestarted();
    localStorage.removeItem(STORAGE_KEY);
    setProgress(initialProgress);
    setIsOnboardingActive(true);
  }, [analytics]);

  // Calculate progress percentage
  const progressPercentage = Math.round(
    (stepOrder.indexOf(progress.currentStep) / (stepOrder.length - 1)) * 100
  );

  return {
    progress,
    isOnboardingActive,
    setUserContext,
    nextStep,
    previousStep,
    goToStep,
    skipOnboarding,
    completeOnboarding,
    resetOnboarding,
    progressPercentage,
    currentStepIndex: stepOrder.indexOf(progress.currentStep),
    totalSteps: stepOrder.length,
  };
}
