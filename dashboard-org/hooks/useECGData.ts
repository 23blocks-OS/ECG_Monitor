'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchLiveData, fetchAlerts } from '@/lib/api';
import type { ECGLiveData, ECGAlertsData } from '@/types';

export function useECGData(deviceId: string = 'ecg-device-001', updateInterval: number = 5000) {
  const [liveData, setLiveData] = useState<ECGLiveData | null>(null);
  const [alertsData, setAlertsData] = useState<ECGAlertsData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const updateLiveData = useCallback(async () => {
    try {
      const data = await fetchLiveData(deviceId);
      setLiveData(data);
      setIsConnected(true);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error updating live data:', error);
      setIsConnected(false);
    }
  }, [deviceId]);

  const updateAlerts = useCallback(async () => {
    try {
      const data = await fetchAlerts(deviceId);
      setAlertsData(data);
    } catch (error) {
      console.error('Error updating alerts:', error);
    }
  }, [deviceId]);

  useEffect(() => {
    updateLiveData();
    updateAlerts();

    const liveDataInterval = setInterval(updateLiveData, updateInterval);
    const alertsInterval = setInterval(updateAlerts, 60000); // Update alerts every minute

    return () => {
      clearInterval(liveDataInterval);
      clearInterval(alertsInterval);
    };
  }, [updateLiveData, updateAlerts, updateInterval]);

  return {
    liveData,
    alertsData,
    isConnected,
    lastUpdated,
    refresh: () => {
      updateLiveData();
      updateAlerts();
    },
  };
}
