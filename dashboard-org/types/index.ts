export interface ECGMetrics {
  heart_rate_bpm: number;
  hrv_rmssd: number;
  signal_quality: number;
}

export interface ECGWaveform {
  channel_1: number[];
  channel_2: number[];
  channel_3: number[];
}

export interface ECGLiveData {
  device_id: string;
  timestamp: number;
  status: 'active' | 'inactive' | 'error';
  metrics: ECGMetrics;
  waveform: ECGWaveform;
}

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ECGAlert {
  alert_id: string;
  timestamp: number;
  severity: AlertSeverity;
  summary: string;
}

export interface ECGAlertsData {
  device_id: string;
  alerts: ECGAlert[];
  count: number;
}

export interface HistoryDataPoint {
  timestamp: number;
  heart_rate_bpm: number;
  hrv_rmssd: number;
  signal_quality: number;
  severity: AlertSeverity;
}

export interface ECGHistoryData {
  device_id: string;
  history: HistoryDataPoint[];
  count: number;
}

// Provider Portal Types

export type UserRole = 'patient' | 'doctor' | 'nurse' | 'admin' | 'caregiver';

export interface Patient {
  user_id: string;
  organization_id: string;
  email: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  gender?: string;
  phone?: string;
  role: UserRole;
  created_at: number;
  account_status: 'active' | 'inactive' | 'suspended';
  medical_history?: {
    conditions?: string[];
    allergies?: string[];
    medications?: string[];
  };
  emergency_contact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  // Current device assignment
  current_device_id?: string;
  last_session_timestamp?: number;
}

export interface ProviderUser {
  user_id: string;
  organization_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  account_status: 'active' | 'inactive';
}

export interface Organization {
  organization_id: string;
  organization_name: string;
  organization_type: 'hospital' | 'clinic' | 'research' | 'personal' | 'home_health';
  settings?: {
    timezone?: string;
    max_users?: number;
    max_devices?: number;
    retention_days?: number;
  };
  subscription?: {
    plan: string;
    status: 'active' | 'inactive' | 'trial';
  };
}

export interface PatientSummary {
  patient: Patient;
  stats: {
    total_sessions: number;
    total_alerts: number;
    last_activity?: number;
    alert_breakdown: {
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
  };
}
