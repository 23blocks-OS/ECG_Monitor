'use client';

import React, { useEffect, useRef, useMemo, useState } from 'react';
import { useOnboarding } from '@/hooks/useOnboarding';
import { onboardingConfig } from '@/lib/onboardingConfig';
import gsap from 'gsap';

interface Props {
  onNext: () => void;
  onBack: () => void;
}

/**
 * Setup guide step
 * Contextual step-by-step instructions based on user's deployment scenario
 */
export default function SetupGuideStep({ onNext, onBack }: Props) {
  const { progress } = useOnboarding();
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current && stepsRef.current) {
      const tl = gsap.timeline();

      tl.fromTo(
        contentRef.current.querySelector('h1'),
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
      );

      tl.fromTo(
        stepsRef.current.children,
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.5, stagger: 0.1, ease: 'power3.out' },
        '-=0.4'
      );
    }
  }, []);

  const { setupSteps } = onboardingConfig;

  // Filter steps based on user context
  const filteredSteps = useMemo(() => {
    return setupSteps.filter(step =>
      step.applicableTo.includes(progress.userContext!)
    );
  }, [setupSteps, progress.userContext]);

  const toggleStep = (stepId: string) => {
    setExpandedStep(expandedStep === stepId ? null : stepId);
  };

  return (
    <div ref={contentRef} className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-accent-purple via-accent-pink to-accent-cyan bg-clip-text text-transparent">
          Setup Guide
        </h1>
        <p className="text-xl text-slate-300 mb-2">
          {progress.userContext === 'self-deployer'
            ? 'Follow these steps to build your complete monitoring system'
            : 'Quick steps to connect and start monitoring'}
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 text-slate-400 text-sm">
          <span>📋</span>
          <span>{filteredSteps.length} steps to complete</span>
        </div>
      </div>

      {/* Setup steps */}
      <div ref={stepsRef} className="space-y-4 mb-12">
        {filteredSteps.map((step, index) => {
          const isExpanded = expandedStep === step.id;

          return (
            <div
              key={step.id}
              className="relative overflow-hidden rounded-2xl backdrop-blur-xl transition-all duration-300"
            >
              {/* Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 to-slate-900/50" />
              <div className="absolute inset-0 border border-white/10 rounded-2xl" />

              {/* Step header */}
              <button
                onClick={() => toggleStep(step.id)}
                className="relative z-10 w-full p-6 text-left transition-colors duration-200 hover:bg-white/5"
              >
                <div className="flex items-start gap-4">
                  {/* Step number */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center font-bold text-white shadow-lg">
                    {index + 1}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">
                      {step.title}
                    </h3>
                    <p className="text-slate-300 mb-2">
                      {step.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-slate-500">⏱️ {step.estimatedTime}</span>
                    </div>
                  </div>

                  {/* Expand icon */}
                  <div className="flex-shrink-0">
                    <div className={`w-6 h-6 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                      ▼
                    </div>
                  </div>
                </div>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="relative z-10 px-6 pb-6">
                  <div className="ml-14 space-y-4">
                    {step.substeps.map((substep, subIndex) => (
                      <div
                        key={subIndex}
                        className={`p-4 rounded-xl ${
                          substep.important
                            ? 'bg-accent-purple/10 border border-accent-purple/30'
                            : 'bg-slate-800/30'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Substep number */}
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-300">
                            {subIndex + 1}
                          </div>

                          <div className="flex-1">
                            <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                              {substep.title}
                              {substep.important && (
                                <span className="px-2 py-0.5 rounded-full bg-accent-purple/20 text-accent-purple text-xs font-medium">
                                  Important
                                </span>
                              )}
                            </h4>
                            <p className="text-slate-300 text-sm leading-relaxed mb-2">
                              {substep.description}
                            </p>

                            {/* Code block */}
                            {substep.code && (
                              <div className="mt-3 p-4 rounded-lg bg-slate-950 border border-slate-700 overflow-x-auto">
                                <pre className="text-sm text-cyan-300 font-mono whitespace-pre">
                                  {substep.code}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Help card */}
      <div className="mb-12 p-6 rounded-2xl backdrop-blur-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-cyan/10 to-accent-blue/10" />
        <div className="absolute inset-0 border border-white/10 rounded-2xl" />

        <div className="relative z-10">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-accent-cyan to-blue-500 flex items-center justify-center text-2xl">
              💡
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-2">
                Need Help?
              </h3>
              <p className="text-slate-300 leading-relaxed">
                Don&apos;t worry if you run into issues! Check the documentation, join our community Discord, or open an issue on GitHub. The ECG Monitor community is here to help you succeed.
              </p>
            </div>
          </div>
        </div>
      </div>

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
          <div className="absolute inset-0 bg-gradient-to-r from-accent-cyan via-accent-pink to-accent-purple opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <span className="relative z-10 flex items-center gap-2">
            I&apos;m Ready!
            <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
          </span>
        </button>
      </div>
    </div>
  );
}
