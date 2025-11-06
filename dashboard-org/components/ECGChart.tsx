'use client';

import { useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface ECGChartProps {
  data: number[];
  label: string;
  color: {
    border: string;
    gradient: [string, string];
  };
  badgeColor: string;
}

export default function ECGChart({ data, label, color, badgeColor }: ECGChartProps) {
  const chartRef = useRef<ChartJS<'line'>>(null);

  const chartData = {
    labels: Array.from({ length: data.length }, (_, i) => i),
    datasets: [
      {
        label,
        data,
        borderColor: color.border,
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 200);
          gradient.addColorStop(0, color.gradient[0]);
          gradient.addColorStop(1, color.gradient[1]);
          return gradient;
        },
        borderWidth: 2.5,
        tension: 0.3,
        pointRadius: 0,
        fill: true,
        cubicInterpolationMode: 'monotone' as const,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0,
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
    scales: {
      x: {
        display: false,
        grid: {
          display: false,
        },
      },
      y: {
        display: true,
        border: {
          display: false,
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.06)',
          lineWidth: 1,
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.4)',
          font: {
            size: 10,
          },
          maxTicksLimit: 5,
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
  };

  return (
    <div className="bg-white/5 rounded-2xl p-6 hover:bg-white/8 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold ${badgeColor}`}>{label}</h3>
        <span className={`text-xs px-3 py-1 rounded-full bg-${badgeColor.split('-')[1]}-500/20 ${badgeColor}`}>
          Active
        </span>
      </div>
      <div className="h-48">
        <Line ref={chartRef} data={chartData} options={options} />
      </div>
    </div>
  );
}
