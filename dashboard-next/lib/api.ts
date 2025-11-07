import type { ECGLiveData, ECGAlertsData, ECGHistoryData, ECGWaveform, ExportParams, ExportData } from '@/types';

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

export async function exportData(params: ExportParams): Promise<Blob> {
  try {
    const { userId, deviceId, startTime, endTime, format } = params;

    let url = `${API_BASE_URL}/api/export?user_id=${userId}&start=${startTime}&end=${endTime}&format=${format}`;
    if (deviceId) {
      url += `&device_id=${deviceId}`;
    }

    const response = await fetch(url, { cache: 'no-store' });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    // Return the response as a Blob for download
    return await response.blob();
  } catch (error) {
    console.error('Error exporting data:', error);
    throw error;
  }
}
