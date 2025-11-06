import type { ECGLiveData, ECGAlertsData, ECGHistoryData, ECGWaveform } from '@/types';

// Configure your API endpoint here
// For development, this will use mock data
const API_BASE_URL = ''; // Set to your API Gateway URL

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
    // Simulate ECG waveform with P, QRS, T waves
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
  const now = Date.now();
  return {
    device_id: 'ecg-device-001',
    alerts: [
      {
        alert_id: '1',
        timestamp: now - 3600000,
        severity: 'medium',
        summary: 'Occasional premature ventricular contractions detected during rest period.'
      },
      {
        alert_id: '2',
        timestamp: now - 7200000,
        severity: 'low',
        summary: 'Heart rate slightly elevated, possibly due to physical activity.'
      },
      {
        alert_id: '3',
        timestamp: now - 10800000,
        severity: 'high',
        summary: 'Irregular rhythm pattern detected. Please consult your physician.'
      },
      {
        alert_id: '4',
        timestamp: now - 14400000,
        severity: 'low',
        summary: 'Signal quality temporarily degraded. Check electrode placement.'
      }
    ],
    count: 4
  };
}

// API functions
export async function fetchLiveData(deviceId: string = 'ecg-device-001'): Promise<ECGLiveData> {
  try {
    if (!API_BASE_URL) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      return getMockLiveData();
    }

    const response = await fetch(`${API_BASE_URL}/api/live?device_id=${deviceId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
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
      await new Promise(resolve => setTimeout(resolve, 300));
      return getMockAlerts();
    }

    const response = await fetch(
      `${API_BASE_URL}/api/alerts?device_id=${deviceId}&hours=${hours}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
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
      await new Promise(resolve => setTimeout(resolve, 300));
      return {
        device_id: 'ecg-device-001',
        history,
        count: history.length
      };
    }

    let url = `${API_BASE_URL}/api/history?device_id=${deviceId}`;
    if (startTime) url += `&start=${startTime}`;
    if (endTime) url += `&end=${endTime}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching history:', error);
    throw error;
  }
}
