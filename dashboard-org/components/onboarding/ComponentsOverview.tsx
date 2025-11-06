'use client';

import React, { useEffect, useRef } from 'react';
import { onboardingConfig } from '@/lib/onboardingConfig';
import gsap from 'gsap';

interface Props {
  onNext: () => void;
  onBack: () => void;
}

/**
 * Components overview step
 * Visual tour of the ECG Monitor system architecture
 */
export default function ComponentsOverview({ onNext, onBack }: Props) {
  const contentRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current && cardsRef.current) {
      const tl = gsap.timeline();

      tl.fromTo(
        contentRef.current.querySelector('h1'),
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
      );

      tl.fromTo(
        cardsRef.current.children,
        { opacity: 0, scale: 0.9, y: 30 },
        { opacity: 1, scale: 1, y: 0, duration: 0.6, stagger: 0.15, ease: 'back.out(1.2)' },
        '-=0.4'
      );
    }
  }, []);

  const { components } = onboardingConfig;

  return (
    <div ref={contentRef} className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-accent-purple via-accent-pink to-accent-cyan bg-clip-text text-transparent">
          System Components
        </h1>
        <p className="text-xl text-slate-300">
          Here&apos;s how everything works together
        </p>
      </div>

      {/* Component cards */}
      <div ref={cardsRef} className="grid md:grid-cols-2 gap-6 mb-12">
        {components.map((component, index) => (
          <div
            key={component.id}
            className="group relative overflow-hidden rounded-3xl p-8 transition-all duration-300 hover:scale-105"
          >
            {/* Glass background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${component.color} opacity-10 backdrop-blur-xl`} />
            <div className="absolute inset-0 border border-white/10 rounded-3xl" />

            {/* Glow effect on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className={`absolute inset-0 bg-gradient-to-br ${component.color} opacity-20 blur-xl`} />
            </div>

            <div className="relative z-10">
              {/* Icon */}
              <div className={`w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br ${component.color} flex items-center justify-center text-3xl shadow-lg`}>
                {component.icon}
              </div>

              {/* Title and description */}
              <h3 className="text-2xl font-bold mb-3 text-white">
                {component.name}
              </h3>
              <p className="text-slate-300 mb-6 leading-relaxed">
                {component.description}
              </p>

              {/* Details list */}
              <ul className="space-y-3">
                {component.details.map((detail, idx) => (
                  <li key={idx} className="flex items-start text-sm text-slate-400">
                    <span className={`mr-3 mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-gradient-to-r ${component.color}`} />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>

              {/* Connection indicator (except last card) */}
              {index < components.length - 1 && (
                <div className="hidden md:block absolute -right-8 top-1/2 transform -translate-y-1/2 z-20">
                  <div className="flex items-center">
                    <div className="w-8 h-0.5 bg-gradient-to-r from-accent-purple to-accent-cyan opacity-50" />
                    <div className="w-2 h-2 rounded-full bg-accent-cyan animate-pulse" />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Flow diagram */}
      <div className="mb-12 p-8 rounded-3xl backdrop-blur-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 to-slate-900/50" />
        <div className="absolute inset-0 border border-white/10 rounded-3xl" />

        <div className="relative z-10">
          <h3 className="text-xl font-bold mb-6 text-white text-center">
            Data Flow
          </h3>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-center">
            <div className="px-4 py-2 rounded-lg bg-purple-500/20 text-purple-300 font-medium">
              ECG Signal
            </div>
            <div className="text-accent-purple text-2xl rotate-90 md:rotate-0">→</div>
            <div className="px-4 py-2 rounded-lg bg-pink-500/20 text-pink-300 font-medium">
              ESP32 Processing
            </div>
            <div className="text-accent-pink text-2xl rotate-90 md:rotate-0">→</div>
            <div className="px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-300 font-medium">
              Cloud API
            </div>
            <div className="text-accent-cyan text-2xl rotate-90 md:rotate-0">→</div>
            <div className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-300 font-medium">
              Your Dashboard
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
            View Requirements
            <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
          </span>
        </button>
      </div>
    </div>
  );
}
