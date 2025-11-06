'use client';

import { useRef, useEffect } from 'react';
import { useAlertAnimation } from '@/hooks/useAnimations';
import { gsap } from 'gsap';
import type { ECGAlert } from '@/types';

interface AlertItemProps {
  alert: ECGAlert;
}

const severityConfig = {
  low: {
    border: 'border-green-500',
    bg: 'bg-gradient-to-br from-green-500 to-emerald-500',
    text: 'text-green-400',
    icon: (
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  medium: {
    border: 'border-yellow-500',
    bg: 'bg-gradient-to-br from-yellow-500 to-amber-500',
    text: 'text-yellow-400',
    icon: (
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    ),
  },
  high: {
    border: 'border-orange-500',
    bg: 'bg-gradient-to-br from-orange-500 to-red-500',
    text: 'text-orange-400',
    icon: (
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  critical: {
    border: 'border-red-500',
    bg: 'bg-gradient-to-br from-red-500 to-pink-500',
    text: 'text-red-400',
    icon: (
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    ),
  },
};

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString();
}

export default function AlertItem({ alert }: AlertItemProps) {
  const alertRef = useRef<HTMLDivElement>(null);
  const config = severityConfig[alert.severity];

  useAlertAnimation(alertRef, alert.severity);

  const handleClick = (e: React.MouseEvent) => {
    if (!alertRef.current) return;

    const ripple = document.createElement('div');
    const rect = alertRef.current.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      left: ${x}px;
      top: ${y}px;
      pointer-events: none;
      transform: scale(0);
    `;

    alertRef.current.style.position = 'relative';
    alertRef.current.style.overflow = 'hidden';
    alertRef.current.appendChild(ripple);

    gsap.to(ripple, {
      scale: 2,
      opacity: 0,
      duration: 0.6,
      ease: 'power2.out',
      onComplete: () => ripple.remove(),
    });
  };

  return (
    <div
      ref={alertRef}
      onClick={handleClick}
      className={`bg-white/5 backdrop-blur-md rounded-2xl p-5 border-l-4 ${config.border} hover:bg-white/10 transition-all duration-300 cursor-pointer`}
    >
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center`}>
            {config.icon}
          </div>
          <span className={`font-bold text-sm ${config.text} uppercase tracking-wider`}>
            {alert.severity}
          </span>
        </div>
        <span className="text-xs text-gray-400 font-medium">{formatTimestamp(alert.timestamp)}</span>
      </div>
      <div className="text-gray-200 leading-relaxed text-sm">{alert.summary}</div>
    </div>
  );
}
