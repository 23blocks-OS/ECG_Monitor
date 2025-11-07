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

export interface ExportMetadata {
  user_id: string;
  device_id: string | null;
  start_time: number;
  end_time: number;
  start_date: string;
  end_date: string;
  export_timestamp: string;
  format: 'json' | 'csv';
  total_sessions: number;
  total_analysis_records: number;
  total_alerts: number;
}

export interface ECGSession {
  session_id: string;
  device_id: string;
  user_id: string;
  start_timestamp: number;
  status: string;
  last_heart_rate?: number;
}

export interface ECGAnalysisRecord {
  batch_id: string;
  device_id: string;
  user_id: string;
  analysis_timestamp: number;
  metrics: {
    heart_rate_bpm: number;
    hrv_rmssd: number;
    signal_quality_score: number;
  };
  analysis: {
    severity: AlertSeverity;
  };
  raw_waveform?: {
    channel_1: number[];
    channel_2: number[];
    channel_3: number[];
  } | null;
}

export interface ExportData {
  export_metadata: ExportMetadata;
  sessions: ECGSession[];
  analysis: ECGAnalysisRecord[];
  alerts: ECGAlert[];
}

export interface ExportParams {
  userId: string;
  deviceId?: string;
  startTime: number;
  endTime: number;
  format: 'json' | 'csv';
}
