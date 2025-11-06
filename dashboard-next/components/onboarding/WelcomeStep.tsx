'use client';

import React, { useEffect, useRef } from 'react';
import { onboardingConfig } from '@/lib/onboardingConfig';
import gsap from 'gsap';

interface Props {
  onNext: () => void;
  onBack: () => void;
}

/**
 * Welcome step - Mission and purpose
 * Explains why ECG Monitor exists
 */
export default function WelcomeStep({ onNext, onBack }: Props) {
  const contentRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const paragraphsRef = useRef<HTMLDivElement>(null);
  const highlightsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current && headingRef.current && paragraphsRef.current && highlightsRef.current) {
      const tl = gsap.timeline();

      tl.fromTo(
        headingRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
      );

      tl.fromTo(
        paragraphsRef.current.children,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out' },
        '-=0.4'
      );

      tl.fromTo(
        highlightsRef.current.children,
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.5, stagger: 0.08, ease: 'power3.out' },
        '-=0.3'
      );
    }
  }, []);

  const { mission } = onboardingConfig;

  return (
    <div ref={contentRef} className="max-w-4xl mx-auto">
      {/* Header */}
      <div ref={headingRef} className="text-center mb-12">
        <div className="inline-block mb-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent-purple via-accent-pink to-accent-cyan p-0.5 animate-pulse-slow">
            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
              <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none">
                <defs>
                  <linearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="50%" stopColor="#ec4899" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
                <path
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                  fill="url(#heartGradient)"
                  className="animate-pulse"
                />
              </svg>
            </div>
          </div>
        </div>

        <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-accent-purple via-accent-pink to-accent-cyan bg-clip-text text-transparent">
          {mission.title}
        </h1>

        <p className="text-2xl text-slate-300">
          {mission.subtitle}
        </p>
      </div>

      {/* Mission description */}
      <div ref={paragraphsRef} className="mb-12 space-y-6">
        {mission.description.map((paragraph, index) => (
          <div key={index} className="relative overflow-hidden rounded-2xl p-6 backdrop-blur-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 to-slate-900/50" />
            <div className="absolute inset-0 border border-white/5 rounded-2xl" />
            <p className="relative z-10 text-lg text-slate-300 leading-relaxed">
              {paragraph}
            </p>
          </div>
        ))}
      </div>

      {/* Highlights */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-white text-center">
          What You&apos;ll Get
        </h2>

        <div ref={highlightsRef} className="space-y-4">
          {mission.highlights.map((highlight, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-xl p-4 transition-all duration-300 hover:scale-102"
            >
              {/* Glass background */}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-800/30 to-slate-900/30 backdrop-blur-xl" />
              <div className="absolute inset-0 border border-white/5 rounded-xl" />

              {/* Gradient accent on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-accent-purple/10 via-accent-pink/10 to-accent-cyan/10" />
              </div>

              <div className="relative z-10 flex items-center gap-4">
                {/* Icon */}
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center">
                  <span className="text-lg">✓</span>
                </div>

                {/* Text */}
                <p className="text-lg text-slate-200 font-medium">
                  {highlight}
                </p>
              </div>
            </div>
          ))}
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
            See the Components
            <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
          </span>
        </button>
      </div>
    </div>
  );
}
