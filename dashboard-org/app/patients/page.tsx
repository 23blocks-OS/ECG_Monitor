'use client';

import { useState } from 'react';
import { useAuth } from '@/components/AuthWrapper';
import PatientSearch from '@/components/PatientSearch';
import PatientCard from '@/components/PatientCard';
import OrganizationStats from '@/components/OrganizationStats';
import OnboardingContainer from '@/components/onboarding/OnboardingContainer';
import { Patient, PatientSummary } from '@/types';
import { useRouter } from 'next/navigation';

export default function PatientsPage() {
  const { organization, user } = useAuth();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientSummaries, setPatientSummaries] = useState<PatientSummary[]>([]);
  const router = useRouter();

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
  };

  const handleViewDashboard = (patient: Patient) => {
    router.push(`/dashboard/${patient.user_id}`);
  };

  // Mock patient summaries - would come from API in production
  const mockSummaries: PatientSummary[] = [
    {
      patient: {
        user_id: 'patient-001-uuid',
        organization_id: organization?.organization_id || 'org-001',
        email: 'john.doe@email.com',
        first_name: 'John',
        last_name: 'Doe',
        date_of_birth: '1975-06-20',
        role: 'patient',
        created_at: Date.now() - 86400000 * 30,
        account_status: 'active',
        current_device_id: 'ecg-device-001',
        last_session_timestamp: Date.now() - 3600000
      },
      stats: {
        total_sessions: 45,
        total_alerts: 3,
        last_activity: Date.now() - 3600000,
        alert_breakdown: { low: 1, medium: 2, high: 0, critical: 0 }
      }
    },
    {
      patient: {
        user_id: 'patient-002-uuid',
        organization_id: organization?.organization_id || 'org-001',
        email: 'jane.smith@email.com',
        first_name: 'Jane',
        last_name: 'Smith',
        date_of_birth: '1982-03-15',
        role: 'patient',
        created_at: Date.now() - 86400000 * 60,
        account_status: 'active',
        current_device_id: 'ecg-device-002',
        last_session_timestamp: Date.now() - 7200000
      },
      stats: {
        total_sessions: 32,
        total_alerts: 5,
        last_activity: Date.now() - 7200000,
        alert_breakdown: { low: 2, medium: 2, high: 1, critical: 0 }
      }
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="gradient-mesh min-h-screen text-white">
      {/* Onboarding overlay - shows for first-time users */}
      <OnboardingContainer />

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Patients</h1>
          <p className="text-gray-400">
            {organization?.organization_name} • {user?.first_name} {user?.last_name} ({user?.role})
          </p>
        </div>

        {/* Organization Stats */}
        {organization && (
          <div className="mb-8">
            <OrganizationStats organization={organization} />
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-8">
          <PatientSearch
            onPatientSelect={handlePatientSelect}
            organizationId={organization?.organization_id || ''}
          />
        </div>

        {/* Selected Patient Card */}
        {selectedPatient && (
          <div className="mb-8">
            <PatientCard
              patient={selectedPatient}
              onClearSelection={() => setSelectedPatient(null)}
            />
            <div className="mt-4 flex gap-4">
              <button
                onClick={() => handleViewDashboard(selectedPatient)}
                className="px-6 py-3 bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all"
              >
                View ECG Dashboard
              </button>
              <button
                onClick={() => router.push(`/patients/${selectedPatient.user_id}/history`)}
                className="px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-all"
              >
                View Full History
              </button>
            </div>
          </div>
        )}

        {/* Patient List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Recent Patients</h2>
            <div className="text-sm text-gray-400">
              {mockSummaries.length} active patients
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mockSummaries.map((summary) => (
              <div
                key={summary.patient.user_id}
                className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all cursor-pointer"
                onClick={() => handleViewDashboard(summary.patient)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center text-lg font-bold">
                      {summary.patient.first_name[0]}{summary.patient.last_name[0]}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        {summary.patient.first_name} {summary.patient.last_name}
                      </h3>
                      <p className="text-sm text-gray-400">{summary.patient.email}</p>
                    </div>
                  </div>
                  {summary.patient.current_device_id && (
                    <div className="px-3 py-1 bg-accent-cyan/20 text-accent-cyan text-xs rounded-full border border-accent-cyan/30">
                      Active
                    </div>
                  )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/20">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Sessions</p>
                    <p className="text-xl font-bold">{summary.stats.total_sessions}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Alerts</p>
                    <p className="text-xl font-bold">{summary.stats.total_alerts}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Last Activity</p>
                    <p className="text-sm">
                      {summary.stats.last_activity
                        ? new Date(summary.stats.last_activity).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Alert Breakdown */}
                {summary.stats.total_alerts > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/20">
                    <p className="text-xs text-gray-400 mb-2">Alert Breakdown</p>
                    <div className="flex gap-3 text-xs">
                      {summary.stats.alert_breakdown.critical > 0 && (
                        <span className="text-red-500">
                          Critical: {summary.stats.alert_breakdown.critical}
                        </span>
                      )}
                      {summary.stats.alert_breakdown.high > 0 && (
                        <span className="text-orange-500">
                          High: {summary.stats.alert_breakdown.high}
                        </span>
                      )}
                      {summary.stats.alert_breakdown.medium > 0 && (
                        <span className="text-yellow-500">
                          Medium: {summary.stats.alert_breakdown.medium}
                        </span>
                      )}
                      {summary.stats.alert_breakdown.low > 0 && (
                        <span className="text-blue-500">
                          Low: {summary.stats.alert_breakdown.low}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
