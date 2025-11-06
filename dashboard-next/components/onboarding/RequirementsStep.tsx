'use client';

import React, { useEffect, useRef, useMemo } from 'react';
import { useOnboarding } from '@/hooks/useOnboarding';
import { onboardingConfig } from '@/lib/onboardingConfig';
import gsap from 'gsap';

interface Props {
  onNext: () => void;
  onBack: () => void;
}

/**
 * Requirements step
 * Shows contextual requirements based on user's deployment scenario
 */
export default function RequirementsStep({ onNext, onBack }: Props) {
  const { progress } = useOnboarding();
  const contentRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current && categoriesRef.current) {
      const tl = gsap.timeline();

      tl.fromTo(
        contentRef.current.querySelector('h1'),
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
      );

      tl.fromTo(
        categoriesRef.current.children,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power3.out' },
        '-=0.4'
      );
    }
  }, []);

  const { requirements } = onboardingConfig;

  // Filter requirements based on user context
  const filteredRequirements = useMemo(() => {
    return requirements.filter(req =>
      req.applicableTo.includes(progress.userContext!)
    );
  }, [requirements, progress.userContext]);

  // Group requirements by category
  const groupedRequirements = useMemo(() => {
    const groups: Record<string, typeof filteredRequirements> = {
      hardware: [],
      software: [],
      network: [],
      optional: [],
    };

    filteredRequirements.forEach(req => {
      groups[req.category].push(req);
    });

    return groups;
  }, [filteredRequirements]);

  const categoryConfig = {
    hardware: {
      title: 'Hardware',
      icon: '🔧',
      color: 'from-purple-500 to-pink-500',
    },
    software: {
      title: 'Software',
      icon: '💻',
      color: 'from-pink-500 to-red-500',
    },
    network: {
      title: 'Network',
      icon: '📡',
      color: 'from-cyan-500 to-blue-500',
    },
    optional: {
      title: 'Optional',
      icon: '✨',
      color: 'from-blue-500 to-purple-500',
    },
  };

  return (
    <div ref={contentRef} className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-accent-purple via-accent-pink to-accent-cyan bg-clip-text text-transparent">
          What You&apos;ll Need
        </h1>
        <p className="text-xl text-slate-300 mb-2">
          {progress.userContext === 'self-deployer'
            ? 'Complete requirements for building your ECG monitoring system'
            : 'Everything you need to start monitoring'}
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 text-slate-400 text-sm">
          <span>Your path:</span>
          <span className="font-semibold text-white">
            {progress.userContext === 'self-deployer' ? '🛠️ Self-Deployer' : '⚡ Quick Start'}
          </span>
        </div>
      </div>

      {/* Requirements by category */}
      <div ref={categoriesRef} className="space-y-8 mb-12">
        {Object.entries(groupedRequirements).map(([category, reqs]) => {
          if (reqs.length === 0) return null;

          const config = categoryConfig[category as keyof typeof categoryConfig];

          return (
            <div key={category} className="space-y-4">
              {/* Category header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center text-xl shadow-lg`}>
                  {config.icon}
                </div>
                <h2 className="text-2xl font-bold text-white">
                  {config.title}
                </h2>
                {category === 'optional' && (
                  <span className="text-sm text-slate-500">(Nice to have)</span>
                )}
              </div>

              {/* Requirement cards */}
              <div className="grid gap-4">
                {reqs.map((req) => (
                  <div
                    key={req.id}
                    className="group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-102"
                  >
                    {/* Glass background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-xl" />
                    <div className="absolute inset-0 border border-white/5 rounded-2xl" />

                    {/* Hover glow */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className={`absolute inset-0 bg-gradient-to-br ${config.color} opacity-10`} />
                    </div>

                    <div className="relative z-10 flex items-start gap-4">
                      {/* Icon */}
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-2xl">
                        {req.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-2">
                          {req.title}
                        </h3>
                        <p className="text-slate-300 leading-relaxed">
                          {req.description}
                        </p>
                      </div>

                      {/* Checkmark (you can add state later to track completion) */}
                      <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-slate-600 group-hover:border-accent-cyan transition-colors duration-200" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary card */}
      <div className="mb-12 p-6 rounded-2xl backdrop-blur-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-purple/10 via-accent-pink/10 to-accent-cyan/10" />
        <div className="absolute inset-0 border border-white/10 rounded-2xl" />

        <div className="relative z-10 text-center">
          <p className="text-lg text-slate-300">
            {progress.userContext === 'self-deployer' ? (
              <>
                <span className="font-semibold text-white">Pro tip:</span> You can start with the basics and add optional components later. The system is designed to be modular and scalable.
              </>
            ) : (
              <>
                <span className="font-semibold text-white">Good news:</span> Most of the technical setup is already done for you. You just need to connect your device and start monitoring!
              </>
            )}
          </p>
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
            Setup Guide
            <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
          </span>
        </button>
      </div>
    </div>
  );
}
