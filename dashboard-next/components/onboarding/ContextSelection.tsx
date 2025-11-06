'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useOnboarding } from '@/hooks/useOnboarding';
import { UserContext } from '@/types/onboarding';
import gsap from 'gsap';

interface Props {
  onNext: () => void;
}

/**
 * First onboarding step - Context selection
 * Asks users about their deployment scenario
 */
export default function ContextSelection({ onNext }: Props) {
  const { setUserContext } = useOnboarding();
  const [selectedContext, setSelectedContext] = useState<UserContext>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current && cardsRef.current) {
      const tl = gsap.timeline();
      tl.fromTo(
        contentRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
      );
      tl.fromTo(
        cardsRef.current.children,
        { opacity: 0, y: 20, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.15, ease: 'power3.out' },
        '-=0.4'
      );
    }
  }, []);

  const handleSelect = (context: UserContext) => {
    setSelectedContext(context);
    setUserContext(context);

    // Animate selection and proceed
    setTimeout(() => {
      onNext();
    }, 400);
  };

  return (
    <div ref={contentRef} className="max-w-4xl mx-auto text-center">
      {/* Header */}
      <div className="mb-12">
        <div className="inline-block mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent-purple via-accent-pink to-accent-cyan p-0.5">
            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
              <span className="text-4xl">🚀</span>
            </div>
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-accent-purple via-accent-pink to-accent-cyan bg-clip-text text-transparent">
          Welcome to ECG Monitor
        </h1>

        <p className="text-xl text-slate-300 mb-2">
          Let&apos;s get you started with real-time cardiac monitoring
        </p>

        <p className="text-slate-400">
          First, tell us about your journey...
        </p>
      </div>

      {/* Context selection cards */}
      <div ref={cardsRef} className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Self-deployer option */}
        <button
          onClick={() => handleSelect('self-deployer')}
          className={`group relative overflow-hidden rounded-3xl p-8 text-left transition-all duration-300 ${
            selectedContext === 'self-deployer'
              ? 'scale-105'
              : 'hover:scale-105'
          }`}
        >
          {/* Glass effect background */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl" />
          <div className="absolute inset-0 border border-white/10 rounded-3xl" />

          {/* Glow effect on hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-accent-purple/20 to-accent-pink/20 blur-xl" />
          </div>

          <div className="relative z-10">
            {/* Icon */}
            <div className="w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center">
              <span className="text-3xl">🛠️</span>
            </div>

            {/* Title */}
            <h3 className="text-2xl font-bold mb-3 text-white">
              I&apos;m Building It Myself
            </h3>

            {/* Description */}
            <p className="text-slate-300 mb-4">
              I&apos;m setting up the hardware, deploying the backend, and configuring everything from scratch.
            </p>

            {/* Features list */}
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>ESP32 hardware assembly guide</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Firmware flashing instructions</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Backend deployment steps</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Complete system integration</span>
              </li>
            </ul>

            {/* Badge */}
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-accent-purple to-accent-pink text-white text-sm font-medium">
              <span>Full Setup Guide</span>
              <span>→</span>
            </div>
          </div>
        </button>

        {/* Managed user option */}
        <button
          onClick={() => handleSelect('managed-user')}
          className={`group relative overflow-hidden rounded-3xl p-8 text-left transition-all duration-300 ${
            selectedContext === 'managed-user'
              ? 'scale-105'
              : 'hover:scale-105'
          }`}
        >
          {/* Glass effect background */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-xl" />
          <div className="absolute inset-0 border border-white/10 rounded-3xl" />

          {/* Glow effect on hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-accent-cyan/20 to-accent-blue/20 blur-xl" />
          </div>

          <div className="relative z-10">
            {/* Icon */}
            <div className="w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-accent-cyan to-blue-500 flex items-center justify-center">
              <span className="text-3xl">⚡</span>
            </div>

            {/* Title */}
            <h3 className="text-2xl font-bold mb-3 text-white">
              It&apos;s Ready to Use
            </h3>

            {/* Description */}
            <p className="text-slate-300 mb-4">
              Someone already deployed it for me, or I found it ready to use. I just need to connect my device.
            </p>

            {/* Features list */}
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Quick device connection guide</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Electrode placement instructions</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Dashboard feature overview</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Start monitoring immediately</span>
              </li>
            </ul>

            {/* Badge */}
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-accent-cyan to-blue-500 text-white text-sm font-medium">
              <span>Quick Start</span>
              <span>→</span>
            </div>
          </div>
        </button>
      </div>

      {/* Help text */}
      <p className="text-sm text-slate-500">
        Don&apos;t worry, you can always access the full documentation later
      </p>
    </div>
  );
}
