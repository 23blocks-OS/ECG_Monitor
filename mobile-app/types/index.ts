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

// BLE Protocol Types
export interface ECGBatchHeader {
  magic: number; // 0x45434721
  version: number;
  length: number;
  crc: number;
  batch_id: number; // Unix timestamp in milliseconds
}

export interface ECGBatch {
  batch_id: string;
  device_id: string;
  start_timestamp: number;
  duration_seconds: number;
  sample_rate: number;
  channels: ECGWaveform;
  signal_quality: number;
  battery_level: number;
}

export interface BLEChunk {
  seq: number;
  total: number;
  dataLength: number;
  data: Uint8Array;
}

// Connection Status Types
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface BLEConnectionStatus {
  state: ConnectionState;
  deviceId?: string;
  deviceName?: string;
  rssi?: number;
  lastConnected?: number;
}

export interface CloudConnectionStatus {
  state: ConnectionState;
  lastSync?: number;
  queuedBatches: number;
}

// Settings Types
export interface UserSettings {
  bleDeviceId?: string;
  bleDeviceName?: string;
  awsRegion: string;
  autoUpload: boolean;
  useWifiOnly: boolean;
  dataRetentionDays: number;
  notificationsEnabled: boolean;
  refreshIntervalMs: number;
}

// AWS Credentials
export interface AWSCredentials {
  region: string;
  endpoint: string;
  clientId: string;
  certificatePath?: string;
  privateKeyPath?: string;
}

// Service Interfaces
export interface BLEDevice {
  id: string;
  name: string;
  rssi: number;
}

export interface UploadQueueItem {
  batch: ECGBatch;
  timestamp: number;
  retryCount: number;
}
