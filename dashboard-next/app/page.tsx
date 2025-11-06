'use client';

import { useEffect } from 'react';
import ParticlesBackground from '@/components/ParticlesBackground';
import Header from '@/components/Header';
import MetricCard from '@/components/MetricCard';
import ECGChart from '@/components/ECGChart';
import AlertItem from '@/components/AlertItem';
import OnboardingContainer from '@/components/onboarding/OnboardingContainer';
import { useECGData } from '@/hooks/useECGData';
import { usePageLoadAnimation } from '@/hooks/useAnimations';

export default function Dashboard() {
  const { liveData, alertsData, isConnected, lastUpdated } = useECGData();

  usePageLoadAnimation();

  return (
    <div className="gradient-mesh min-h-screen text-white overflow-x-hidden">
      <ParticlesBackground />

      {/* Onboarding overlay - shows for first-time users */}
      <OnboardingContainer />

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        <Header isConnected={isConnected} lastUpdated={lastUpdated} />

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" id="metrics-grid">
          <MetricCard
            label="Heart Rate"
            value={liveData?.metrics.heart_rate_bpm || '--'}
            unit="BPM"
            gradient="bg-gradient-to-br from-red-500 to-pink-500"
            progressPercent={70}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            }
          />

          <MetricCard
            label="HRV (RMSSD)"
            value={liveData?.metrics.hrv_rmssd.toFixed(1) || '--'}
            unit="ms"
            gradient="bg-gradient-to-br from-purple-500 to-indigo-500"
            progressPercent={85}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            }
          />

          <MetricCard
            label="Signal Quality"
            value={liveData ? Math.round(liveData.metrics.signal_quality * 100) : '--'}
            unit="%"
            gradient="bg-gradient-to-br from-cyan-500 to-blue-500"
            progressPercent={92}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            }
          />

          <MetricCard
            label="Device Status"
            value={liveData?.status || 'Unknown'}
            unit=""
            gradient="bg-gradient-to-br from-green-500 to-emerald-500"
            progressPercent={100}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
          />
        </div>

        {/* ECG Waveforms Section */}
        <div
          id="charts-section"
          className="glass-effect rounded-3xl p-8 mb-8 opacity-0 transform translate-y-[30px]"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-accent-purple to-accent-cyan bg-clip-text text-transparent">
              Real-time ECG Waveforms
            </h2>
            <button className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </button>
          </div>

          <div className="space-y-6">
            {liveData?.waveform.channel_1 && (
              <ECGChart
                data={liveData.waveform.channel_1}
                label="Lead I"
                color={{
                  border: 'rgb(168, 85, 247)',
                  gradient: ['rgba(168, 85, 247, 0.4)', 'rgba(168, 85, 247, 0.01)'],
                }}
                badgeColor="text-purple-300"
              />
            )}

            {liveData?.waveform.channel_2 && (
              <ECGChart
                data={liveData.waveform.channel_2}
                label="Lead II"
                color={{
                  border: 'rgb(6, 182, 212)',
                  gradient: ['rgba(6, 182, 212, 0.4)', 'rgba(6, 182, 212, 0.01)'],
                }}
                badgeColor="text-cyan-300"
              />
            )}

            {liveData?.waveform.channel_3 && (
              <ECGChart
                data={liveData.waveform.channel_3}
                label="Lead III"
                color={{
                  border: 'rgb(236, 72, 153)',
                  gradient: ['rgba(236, 72, 153, 0.4)', 'rgba(236, 72, 153, 0.01)'],
                }}
                badgeColor="text-pink-300"
              />
            )}
          </div>
        </div>

        {/* Alerts Section */}
        <div
          id="alerts-section"
          className="glass-effect rounded-3xl p-8 mb-8 opacity-0 transform translate-y-[30px]"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-accent-pink to-accent-purple bg-clip-text text-transparent">
              Recent Alerts
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs px-3 py-1 rounded-full bg-white/5">Last 24h</span>
            </div>
          </div>
          <div className="space-y-4">
            {alertsData && alertsData.alerts.length > 0 ? (
              alertsData.alerts.map((alert) => <AlertItem key={alert.alert_id} alert={alert} />)
            ) : (
              <p className="text-center text-gray-500 py-12">No alerts</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer
          id="footer"
          className="glass-effect rounded-3xl p-6 text-center opacity-0 transform translate-y-[30px]"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              ECG Monitor System • Last Updated:{' '}
              <span className="text-white font-medium">
                {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}
              </span>
            </p>
            <p className="text-sm text-red-400 font-medium flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              This is NOT a medical device. Always consult healthcare professionals.
            </p>
          </div>
        </footer>
      </div>

      <style jsx>{`
        .heartbeat-line {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: dash 2s linear forwards;
        }

        @keyframes dash {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
}
