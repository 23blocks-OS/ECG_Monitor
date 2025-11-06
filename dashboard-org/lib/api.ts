import type { ECGLiveData, ECGAlertsData, ECGHistoryData, ECGWaveform, Patient, PatientSummary, Organization } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Mock data generators
function generateMockWaveform(): ECGWaveform {
  const points = 100;
  const waveform: ECGWaveform = {
    channel_1: [],
    channel_2: [],
    channel_3: []
  };

  for (let i = 0; i < points; i++) {
    const t = i / points;
    // Simulate ECG waveform
    const val1 = Math.sin(t * 12 * Math.PI) * 100 + Math.sin(t * 120 * Math.PI) * 20;
    const val2 = Math.sin(t * 12 * Math.PI + 0.5) * 90 + Math.sin(t * 120 * Math.PI) * 15;
    const val3 = Math.sin(t * 12 * Math.PI + 1.0) * 95 + Math.sin(t * 120 * Math.PI) * 18;

    waveform.channel_1.push(Math.round(val1));
    waveform.channel_2.push(Math.round(val2));
    waveform.channel_3.push(Math.round(val3));
  }

  return waveform;
}

function getMockLiveData(): ECGLiveData {
  return {
    device_id: 'ecg-device-001',
    timestamp: Date.now(),
    status: 'active',
    metrics: {
      heart_rate_bpm: 72 + Math.floor(Math.random() * 10 - 5),
      hrv_rmssd: 42.5 + Math.random() * 10 - 5,
      signal_quality: 0.85 + Math.random() * 0.15
    },
    waveform: generateMockWaveform()
  };
}

function getMockAlerts(): ECGAlertsData {
  return {
    device_id: 'ecg-device-001',
    alerts: [
      {
        alert_id: '1',
        timestamp: Date.now() - 3600000,
        severity: 'medium',
        summary: 'Occasional premature ventricular contractions detected during rest period.'
      },
      {
        alert_id: '2',
        timestamp: Date.now() - 7200000,
        severity: 'low',
        summary: 'Heart rate slightly elevated, possibly due to physical activity.'
      }
    ],
    count: 2
  };
}

// API functions
export async function fetchLiveData(deviceId: string = 'ecg-device-001'): Promise<ECGLiveData> {
  try {
    if (!API_BASE_URL) {
      return getMockLiveData();
    }

    const response = await fetch(`${API_BASE_URL}/api/live?device_id=${deviceId}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching live data:', error);
    return getMockLiveData();
  }
}

export async function fetchAlerts(
  deviceId: string = 'ecg-device-001',
  hours: number = 24
): Promise<ECGAlertsData> {
  try {
    if (!API_BASE_URL) {
      return getMockAlerts();
    }

    const response = await fetch(
      `${API_BASE_URL}/api/alerts?device_id=${deviceId}&hours=${hours}`,
      { cache: 'no-store' }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return getMockAlerts();
  }
}

export async function fetchHistory(
  deviceId: string = 'ecg-device-001',
  startTime?: number,
  endTime?: number
): Promise<ECGHistoryData> {
  try {
    if (!API_BASE_URL) {
      const history = [];
      const now = Date.now();
      for (let i = 0; i < 60; i++) {
        history.push({
          timestamp: now - (60 - i) * 60000,
          heart_rate_bpm: 70 + Math.floor(Math.random() * 20 - 10),
          hrv_rmssd: 40 + Math.random() * 20 - 10,
          signal_quality: 0.8 + Math.random() * 0.2,
          severity: 'low' as const
        });
      }
      return {
        device_id: 'ecg-device-001',
        history,
        count: history.length
      };
    }

    let url = `${API_BASE_URL}/api/history?device_id=${deviceId}`;
    if (startTime) url += `&start=${startTime}`;
    if (endTime) url += `&end=${endTime}`;

    const response = await fetch(url, { cache: 'no-store' });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching history:', error);
    throw error;
  }
}

// Provider Portal API Functions

export async function fetchOrganizationPatients(organizationId: string): Promise<Patient[]> {
  try {
    if (!API_BASE_URL) {
      // Return mock patients
      return getMockPatients(organizationId);
    }

    const response = await fetch(
      `${API_BASE_URL}/api/organizations/${organizationId}/patients`,
      { cache: 'no-store' }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.patients || [];
  } catch (error) {
    console.error('Error fetching organization patients:', error);
    return getMockPatients(organizationId);
  }
}

export async function fetchPatient(patientId: string): Promise<Patient | null> {
  try {
    if (!API_BASE_URL) {
      const patients = getMockPatients('org-001');
      return patients.find(p => p.user_id === patientId) || null;
    }

    const response = await fetch(`${API_BASE_URL}/api/patients/${patientId}`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.patient;
  } catch (error) {
    console.error('Error fetching patient:', error);
    return null;
  }
}

export async function fetchPatientSummaries(organizationId: string): Promise<PatientSummary[]> {
  try {
    if (!API_BASE_URL) {
      return getMockPatientSummaries(organizationId);
    }

    const response = await fetch(
      `${API_BASE_URL}/api/organizations/${organizationId}/patient-summaries`,
      { cache: 'no-store' }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.summaries || [];
  } catch (error) {
    console.error('Error fetching patient summaries:', error);
    return getMockPatientSummaries(organizationId);
  }
}

export async function fetchOrganization(organizationId: string): Promise<Organization | null> {
  try {
    if (!API_BASE_URL) {
      return getMockOrganization(organizationId);
    }

    const response = await fetch(`${API_BASE_URL}/api/organizations/${organizationId}`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.organization;
  } catch (error) {
    console.error('Error fetching organization:', error);
    return getMockOrganization(organizationId);
  }
}

// Mock data for provider portal
function getMockPatients(organizationId: string): Patient[] {
  return [
    {
      user_id: 'patient-001-uuid',
      organization_id: organizationId,
      email: 'john.doe@email.com',
      first_name: 'John',
      last_name: 'Doe',
      date_of_birth: '1975-06-20',
      gender: 'male',
      phone: '+1-555-0123',
      role: 'patient',
      created_at: Date.now() - 86400000 * 30,
      account_status: 'active',
      current_device_id: 'ecg-device-001',
      last_session_timestamp: Date.now() - 3600000,
      medical_history: {
        conditions: ['hypertension'],
        medications: ['lisinopril']
      }
    },
    {
      user_id: 'patient-002-uuid',
      organization_id: organizationId,
      email: 'jane.smith@email.com',
      first_name: 'Jane',
      last_name: 'Smith',
      date_of_birth: '1982-03-15',
      gender: 'female',
      phone: '+1-555-0124',
      role: 'patient',
      created_at: Date.now() - 86400000 * 60,
      account_status: 'active',
      current_device_id: 'ecg-device-002',
      last_session_timestamp: Date.now() - 7200000
    },
    {
      user_id: 'patient-003-uuid',
      organization_id: organizationId,
      email: 'robert.johnson@email.com',
      first_name: 'Robert',
      last_name: 'Johnson',
      date_of_birth: '1968-11-08',
      gender: 'male',
      role: 'patient',
      created_at: Date.now() - 86400000 * 90,
      account_status: 'active',
      last_session_timestamp: Date.now() - 86400000 * 2
    }
  ];
}

function getMockPatientSummaries(organizationId: string): PatientSummary[] {
  const patients = getMockPatients(organizationId);
  return patients.map(patient => ({
    patient,
    stats: {
      total_sessions: Math.floor(Math.random() * 50 + 10),
      total_alerts: Math.floor(Math.random() * 10),
      last_activity: patient.last_session_timestamp,
      alert_breakdown: {
        low: Math.floor(Math.random() * 3),
        medium: Math.floor(Math.random() * 3),
        high: Math.floor(Math.random() * 2),
        critical: Math.floor(Math.random() * 1)
      }
    }
  }));
}

function getMockOrganization(organizationId: string): Organization {
  return {
    organization_id: organizationId,
    organization_name: 'Downtown Family Clinic',
    organization_type: 'clinic',
    settings: {
      timezone: 'America/Chicago',
      max_users: 100,
      max_devices: 20,
      retention_days: 365
    },
    subscription: {
      plan: 'professional',
      status: 'active'
    }
  };
}
