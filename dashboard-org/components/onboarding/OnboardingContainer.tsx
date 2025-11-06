'use client';

import React, { useEffect, useRef } from 'react';
import { useOnboarding } from '@/hooks/useOnboarding';
import gsap from 'gsap';
import ParticlesBackground from '../ParticlesBackground';
import ContextSelection from './ContextSelection';
import WelcomeStep from './WelcomeStep';
import ComponentsOverview from './ComponentsOverview';
import RequirementsStep from './RequirementsStep';
import SetupGuideStep from './SetupGuideStep';
import CompletionStep from './CompletionStep';

/**
 * Main onboarding container
 * Manages the multi-step onboarding journey with animations
 */
export default function OnboardingContainer() {
  const {
    progress,
    isOnboardingActive,
    nextStep,
    previousStep,
    skipOnboarding,
    progressPercentage,
    currentStepIndex,
    totalSteps,
  } = useOnboarding();

  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Animate progress bar
  useEffect(() => {
    if (progressBarRef.current) {
      gsap.to(progressBarRef.current, {
        width: `${progressPercentage}%`,
        duration: 0.6,
        ease: 'power3.out',
      });
    }
  }, [progressPercentage]);

  // Fade in container on mount
  useEffect(() => {
    if (containerRef.current && isOnboardingActive) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
      );
    }
  }, [isOnboardingActive]);

  if (!isOnboardingActive) {
    return null;
  }

  const renderStep = () => {
    switch (progress.currentStep) {
      case 'context-selection':
        return <ContextSelection onNext={nextStep} />;
      case 'welcome':
        return <WelcomeStep onNext={nextStep} onBack={previousStep} />;
      case 'components-overview':
        return <ComponentsOverview onNext={nextStep} onBack={previousStep} />;
      case 'requirements':
        return <RequirementsStep onNext={nextStep} onBack={previousStep} />;
      case 'setup-guide':
        return <SetupGuideStep onNext={nextStep} onBack={previousStep} />;
      case 'completion':
        return <CompletionStep />;
      default:
        return null;
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950"
    >
      {/* Animated background */}
      <ParticlesBackground />

      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-10 h-1 bg-slate-800">
        <div
          ref={progressBarRef}
          className="h-full bg-gradient-to-r from-accent-purple via-accent-pink to-accent-cyan"
          style={{ width: '0%' }}
        />
      </div>

      {/* Skip button */}
      {progress.canSkip && progress.currentStep !== 'completion' && (
        <button
          onClick={skipOnboarding}
          className="fixed top-6 right-6 z-10 text-slate-400 hover:text-white transition-colors duration-200 text-sm font-medium"
        >
          Skip for now
        </button>
      )}

      {/* Step indicator */}
      <div className="fixed top-6 left-6 z-10 text-slate-400 text-sm font-medium">
        Step {currentStepIndex + 1} of {totalSteps}
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full h-full overflow-y-auto">
        <div className="min-h-full flex items-center justify-center p-6">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}
