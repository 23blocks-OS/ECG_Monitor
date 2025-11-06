import { useState, useEffect, useCallback } from 'react';
import { fetchLiveData, fetchAlerts } from '@/services/api';
import type { ECGLiveData, ECGAlertsData } from '@/types';

export function useECGData(deviceId: string = 'ecg-device-001', intervalMs: number = 5000) {
  const [liveData, setLiveData] = useState<ECGLiveData | null>(null);
  const [alerts, setAlerts] = useState<ECGAlertsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLiveData = useCallback(async () => {
    try {
      const data = await fetchLiveData(deviceId);
      setLiveData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch live data');
    } finally {
      setIsLoading(false);
    }
  }, [deviceId]);

  const loadAlerts = useCallback(async () => {
    try {
      const data = await fetchAlerts(deviceId, 24);
      setAlerts(data);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    }
  }, [deviceId]);

  useEffect(() => {
    // Initial load
    loadLiveData();
    loadAlerts();

    // Set up polling
    const liveDataInterval = setInterval(loadLiveData, intervalMs);
    const alertsInterval = setInterval(loadAlerts, intervalMs * 2); // Less frequent

    return () => {
      clearInterval(liveDataInterval);
      clearInterval(alertsInterval);
    };
  }, [loadLiveData, loadAlerts, intervalMs]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([loadLiveData(), loadAlerts()]);
  }, [loadLiveData, loadAlerts]);

  return {
    liveData,
    alerts,
    isLoading,
    error,
    refresh,
  };
}
