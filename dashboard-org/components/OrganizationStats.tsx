'use client';

import { useEffect, useState } from 'react';
import { Organization } from '@/types';

interface OrgStats {
  total_patients: number;
  active_patients: number;
  total_devices: number;
  active_devices: number;
  total_sessions_today: number;
  total_alerts_today: number;
  critical_alerts_count: number;
}

interface OrganizationStatsProps {
  organization: Organization;
}

export default function OrganizationStats({ organization }: OrganizationStatsProps) {
  const [stats, setStats] = useState<OrgStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [organization.organization_id]);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/organizations/${organization.organization_id}/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      } else {
        // Mock data for development
        setStats(getMockStats());
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats(getMockStats());
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="glass-card p-6 rounded-2xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/10 rounded w-1/3"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-white/10 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      label: 'Total Patients',
      value: stats.total_patients,
      subValue: `${stats.active_patients} active`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      label: 'Active Devices',
      value: stats.active_devices,
      subValue: `of ${stats.total_devices} total`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a 2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      label: 'Sessions Today',
      value: stats.total_sessions_today,
      subValue: 'ECG recordings',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      label: 'Alerts Today',
      value: stats.total_alerts_today,
      subValue: `${stats.critical_alerts_count} critical`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      gradient: 'from-orange-500 to-red-500'
    }
  ];

  return (
    <div className="glass-card p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Organization Overview</h2>
        <button
          onClick={fetchStats}
          className="p-2 hover:bg-white/10 rounded-lg transition-all"
          title="Refresh stats"
        >
          <svg className="w-5 h-5 text-gray-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg bg-gradient-to-br ${card.gradient}`}>
                {card.icon}
              </div>
            </div>
            <div className="text-3xl font-bold mb-1">{card.value}</div>
            <div className="text-sm text-gray-400">{card.label}</div>
            <div className="text-xs text-gray-500 mt-1">{card.subValue}</div>
          </div>
        ))}
      </div>

      {/* Organization Details */}
      <div className="mt-6 pt-6 border-t border-white/20 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-gray-400 mb-1">Organization Type</p>
          <p className="font-semibold capitalize">{organization.organization_type}</p>
        </div>
        <div>
          <p className="text-gray-400 mb-1">Subscription Plan</p>
          <p className="font-semibold capitalize">{organization.subscription?.plan || 'N/A'}</p>
        </div>
        <div>
          <p className="text-gray-400 mb-1">Max Capacity</p>
          <p className="font-semibold">
            {stats.total_patients}/{organization.settings?.max_users || 'Unlimited'} patients
          </p>
        </div>
        <div>
          <p className="text-gray-400 mb-1">Device Capacity</p>
          <p className="font-semibold">
            {stats.active_devices}/{organization.settings?.max_devices || 'Unlimited'} devices
          </p>
        </div>
      </div>
    </div>
  );
}

// Mock stats data for development
function getMockStats(): OrgStats {
  return {
    total_patients: 48,
    active_patients: 32,
    total_devices: 15,
    active_devices: 12,
    total_sessions_today: 78,
    total_alerts_today: 5,
    critical_alerts_count: 1
  };
}
