'use client';

import { useRef } from 'react';
import { useHoverAnimation } from '@/hooks/useAnimations';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit: string;
  icon: React.ReactNode;
  gradient: string;
  progressPercent?: number;
}

export default function MetricCard({
  label,
  value,
  unit,
  icon,
  gradient,
  progressPercent = 70,
}: MetricCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  useHoverAnimation(cardRef);

  return (
    <div
      ref={cardRef}
      className="metric-card glass-effect rounded-3xl p-6 opacity-0 transform translate-y-[30px] hover:scale-105 transition-transform duration-300 cursor-pointer"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">{label}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl ${gradient} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className={`text-5xl font-bold bg-gradient-to-r ${gradient.replace('bg-gradient-to-br', 'from')} bg-clip-text text-transparent`}>
          {value}
        </span>
        <span className="text-gray-400 text-lg">{unit}</span>
      </div>
      <div className="mt-4 h-1 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full ${gradient.replace('bg-gradient-to-br', 'bg-gradient-to-r')} rounded-full transition-all duration-500`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
