'use client';

import React, { useEffect, useRef } from 'react';
import { useOnboarding } from '@/hooks/useOnboarding';
import gsap from 'gsap';

/**
 * Completion step
 * Celebrates successful onboarding and transitions to dashboard
 */
export default function CompletionStep() {
  const { completeOnboarding, progress } = useOnboarding();
  const contentRef = useRef<HTMLDivElement>(null);
  const celebrationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current && celebrationRef.current) {
      const tl = gsap.timeline();

      // Celebration animation
      tl.fromTo(
        celebrationRef.current,
        { scale: 0, rotate: -180, opacity: 0 },
        { scale: 1, rotate: 0, opacity: 1, duration: 1, ease: 'elastic.out(1, 0.5)' }
      );

      tl.fromTo(
        contentRef.current.querySelector('h1'),
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' },
        '-=0.6'
      );

      tl.fromTo(
        contentRef.current.querySelectorAll('.fade-in-up'),
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out' },
        '-=0.4'
      );

      // Particle burst effect
      const particles = celebrationRef.current.querySelectorAll('.particle');
      tl.to(
        particles,
        {
          y: -200,
          x: (index) => (index % 2 === 0 ? -100 : 100) * (Math.random() * 0.5 + 0.5),
          opacity: 0,
          duration: 2,
          stagger: 0.05,
          ease: 'power2.out',
        },
        '-=0.8'
      );
    }
  }, []);

  const handleStart = () => {
    completeOnboarding();
    // The dashboard will automatically show when isOnboardingActive becomes false
  };

  return (
    <div ref={contentRef} className="max-w-3xl mx-auto text-center">
      {/* Celebration icon with particles */}
      <div ref={celebrationRef} className="relative mb-12">
        {/* Main icon */}
        <div className="relative inline-block">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-accent-purple via-accent-pink to-accent-cyan p-1 shadow-2xl">
            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
              <span className="text-6xl">🎉</span>
            </div>
          </div>

          {/* Animated particles */}
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="particle absolute top-1/2 left-1/2 w-2 h-2 rounded-full"
              style={{
                background: i % 3 === 0 ? '#8b5cf6' : i % 3 === 1 ? '#ec4899' : '#06b6d4',
                transform: `rotate(${i * 30}deg) translateY(-40px)`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Header */}
      <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-accent-purple via-accent-pink to-accent-cyan bg-clip-text text-transparent">
        You&apos;re All Set!
      </h1>

      {/* Success message */}
      <div className="fade-in-up mb-8">
        <p className="text-2xl text-slate-300 mb-4">
          {progress.userContext === 'self-deployer'
            ? 'You now have all the knowledge to build and deploy your ECG monitoring system.'
            : 'You\'re ready to start monitoring your cardiac health in real-time.'}
        </p>
        <p className="text-lg text-slate-400">
          Welcome to the future of personal heart health monitoring.
        </p>
      </div>

      {/* Quick tips */}
      <div className="fade-in-up mb-12 space-y-4">
        <div className="p-6 rounded-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10" />
          <div className="absolute inset-0 border border-white/10 rounded-2xl" />

          <div className="relative z-10 flex items-start gap-4 text-left">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center text-xl">
              📊
            </div>
            <div>
              <h3 className="font-bold text-white mb-2">Your Dashboard Awaits</h3>
              <p className="text-slate-300 text-sm">
                View real-time ECG waveforms, heart rate, HRV metrics, and intelligent alerts all in one beautiful interface.
              </p>
            </div>
          </div>
        </div>

        <div className="fade-in-up p-6 rounded-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10" />
          <div className="absolute inset-0 border border-white/10 rounded-2xl" />

          <div className="relative z-10 flex items-start gap-4 text-left">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-accent-cyan to-blue-500 flex items-center justify-center text-xl">
              🔔
            </div>
            <div>
              <h3 className="font-bold text-white mb-2">Smart Alerts</h3>
              <p className="text-slate-300 text-sm">
                Get notified of any cardiac anomalies or irregular patterns detected by our intelligent monitoring system.
              </p>
            </div>
          </div>
        </div>

        <div className="fade-in-up p-6 rounded-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-red-500/10" />
          <div className="absolute inset-0 border border-white/10 rounded-2xl" />

          <div className="relative z-10 flex items-start gap-4 text-left">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-accent-pink to-red-500 flex items-center justify-center text-xl">
              📚
            </div>
            <div>
              <h3 className="font-bold text-white mb-2">Always Learning</h3>
              <p className="text-slate-300 text-sm">
                Access documentation anytime, contribute to the open-source project, and join our growing community.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action button */}
      <div className="fade-in-up">
        <button
          onClick={handleStart}
          className="group relative overflow-hidden px-12 py-4 rounded-2xl font-bold text-lg text-white transition-all duration-300 hover:scale-105 shadow-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-accent-purple via-accent-pink to-accent-cyan" />
          <div className="absolute inset-0 bg-gradient-to-r from-accent-cyan via-accent-pink to-accent-purple opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <span className="relative z-10 flex items-center gap-3">
            <span>Start Monitoring</span>
            <span className="text-2xl group-hover:scale-110 transition-transform duration-200">💓</span>
          </span>
        </button>

        <p className="mt-6 text-sm text-slate-500">
          You can revisit this guide anytime from the dashboard settings
        </p>
      </div>
    </div>
  );
}
