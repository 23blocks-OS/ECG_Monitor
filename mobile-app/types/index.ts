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

export interface ECGHistoryPoint {
  timestamp: number;
  heart_rate_bpm: number;
  hrv_rmssd: number;
  signal_quality: number;
  severity: AlertSeverity;
}

export interface ECGHistoryData {
  device_id: string;
  history: ECGHistoryPoint[];
  count: number;
}
