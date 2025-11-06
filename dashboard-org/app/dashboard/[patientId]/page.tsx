'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ParticlesBackground from '@/components/ParticlesBackground';
import Header from '@/components/Header';
import MetricCard from '@/components/MetricCard';
import ECGChart from '@/components/ECGChart';
import AlertItem from '@/components/AlertItem';
import PatientCard from '@/components/PatientCard';
import { useECGData } from '@/hooks/useECGData';
import { usePageLoadAnimation } from '@/hooks/useAnimations';
import { useAuth } from '@/components/AuthWrapper';
import { Patient } from '@/types';

export default function PatientDashboard() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.patientId as string;
  const { organization } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);

  // Use the patient's device_id to fetch ECG data
  const { liveData, alertsData, isConnected, lastUpdated } = useECGData(patient?.current_device_id || '');

  usePageLoadAnimation();

  useEffect(() => {
    // Fetch patient details
    const fetchPatient = async () => {
      try {
        const response = await fetch(`/api/patients/${patientId}`);
        if (response.ok) {
          const data = await response.json();
          setPatient(data.patient);
        } else {
          // Mock patient data for development
          setPatient(getMockPatient(patientId));
        }
      } catch (error) {
        console.error('Error fetching patient:', error);
        setPatient(getMockPatient(patientId));
      }
    };

    if (patientId) {
      fetchPatient();
    }
  }, [patientId]);

  if (!patient) {
    return (
      <div className="gradient-mesh min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-accent-purple mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading patient data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="gradient-mesh min-h-screen text-white overflow-x-hidden">
      <ParticlesBackground />

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        {/* Back Button */}
        <button
          onClick={() => router.push('/patients')}
          className="mb-4 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Patients
        </button>

        {/* Patient Info Card */}
        <div className="mb-6">
          <PatientCard patient={patient} />
        </div>

        <Header
          isConnected={isConnected}
          lastUpdated={lastUpdated}
          customTitle={`ECG Monitor - ${patient.first_name} ${patient.last_name}`}
        />

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8" id="charts-grid">
          <div className="glass-card p-6 rounded-2xl">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-accent-pink rounded-full"></span>
              Lead I
            </h3>
            <ECGChart
              data={liveData?.waveform.channel_1 || []}
              label="Lead I"
              color="rgba(236, 72, 153, 0.8)"
            />
          </div>

          <div className="glass-card p-6 rounded-2xl">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-accent-purple rounded-full"></span>
              Lead II
            </h3>
            <ECGChart
              data={liveData?.waveform.channel_2 || []}
              label="Lead II"
              color="rgba(139, 92, 246, 0.8)"
            />
          </div>

          <div className="glass-card p-6 rounded-2xl">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-accent-cyan rounded-full"></span>
              Lead III
            </h3>
            <ECGChart
              data={liveData?.waveform.channel_3 || []}
              label="Lead III"
              color="rgba(6, 182, 212, 0.8)"
            />
          </div>
        </div>

        {/* Alerts Section */}
        <div className="glass-card p-6 rounded-2xl" id="alerts-section">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              Recent Alerts
            </h2>
            <span className="text-sm text-gray-400">
              Last 24 hours • {alertsData?.count || 0} alerts
            </span>
          </div>

          <div className="space-y-3">
            {alertsData?.alerts && alertsData.alerts.length > 0 ? (
              alertsData.alerts.map((alert) => (
                <AlertItem key={alert.alert_id} alert={alert} />
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p>No alerts in the last 24 hours</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Mock patient data for development
function getMockPatient(patientId: string): Patient {
  return {
    user_id: patientId,
    organization_id: 'org-001',
    email: 'patient@email.com',
    first_name: 'Patient',
    last_name: 'Name',
    date_of_birth: '1975-06-20',
    role: 'patient',
    created_at: Date.now() - 86400000 * 30,
    account_status: 'active',
    current_device_id: 'ecg-device-001',
    last_session_timestamp: Date.now() - 3600000
  };
}
