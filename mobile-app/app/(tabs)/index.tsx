import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useECGData } from '@/hooks/useECGData';
import { MetricCard } from '@/components/MetricCard';
import { ECGChart } from '@/components/ECGChart';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { Colors } from '@/constants/Colors';
import { useAppSelector, useAppDispatch } from '@/state/hooks';
import { setBatch, setReceivingData } from '@/state/slices/ecgSlice';
import { setBLEConnectionState, setCloudConnectionState } from '@/state/slices/connectionSlice';
import BLEService from '@/services/BLEService';
import CloudService from '@/services/CloudService';
import NotificationService from '@/services/NotificationService';

export default function DashboardScreen() {
  const dispatch = useAppDispatch();
  const { liveData, isLoading, error, refresh } = useECGData();
  const ecgData = useAppSelector((state) => state.ecg.liveData);
  const bleConnection = useAppSelector((state) => state.connection.ble);
  const cloudConnection = useAppSelector((state) => state.connection.cloud);
  const settings = useAppSelector((state) => state.settings);

  // Initialize services
  useEffect(() => {
    // Setup BLE service callbacks
    BLEService.onDataReceived((batch) => {
      console.log('Received ECG batch:', batch.batch_id);
      dispatch(setBatch(batch));
      dispatch(setReceivingData(true));

      // Upload to cloud if auto-upload is enabled
      if (settings.autoUpload) {
        CloudService.uploadBatch(batch);
      }
    });

    BLEService.onConnectionEstablished((device) => {
      console.log('BLE connected:', device.name);
      dispatch(setBLEConnectionState('connected'));
      NotificationService.showNotification(
        'Device Connected',
        `Connected to ${device.name}`
      );
    });

    BLEService.onConnectionLost(() => {
      console.log('BLE connection lost');
      dispatch(setBLEConnectionState('disconnected'));
      dispatch(setReceivingData(false));
      NotificationService.showNotification(
        'Device Disconnected',
        'Attempting to reconnect...'
      );
    });

    // Setup Cloud service callbacks
    CloudService.onConnectionChanged((connected) => {
      dispatch(setCloudConnectionState(connected ? 'connected' : 'disconnected'));
    });

    CloudService.onAlert((alert) => {
      NotificationService.showAlertNotification(alert);
    });

    // Request notification permissions
    NotificationService.requestPermissions();

    // Auto-connect to last paired device
    if (settings.bleDeviceId) {
      BLEService.connectToDevice(settings.bleDeviceId)
        .then(() => BLEService.startDataStream())
        .catch((error) => console.error('Auto-connect failed:', error));
    }

    // Cleanup
    return () => {
      // Services are singletons, no need to destroy on unmount
    };
  }, [dispatch, settings.autoUpload, settings.bleDeviceId]);

  if (isLoading && !liveData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.dark.primary} />
          <Text style={styles.loadingText}>Loading ECG data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !liveData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>❌ {error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!liveData) {
    return null;
  }

  const { metrics, waveform, status, timestamp } = liveData;
  const lastUpdate = new Date(timestamp).toLocaleTimeString();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refresh}
            tintColor={Colors.dark.primary}
          />
        }
      >
        {/* Header with Connection Status */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>ECG Monitor</Text>
          <ConnectionStatus compact />
        </View>

        {/* Last Update */}
        <Text style={styles.lastUpdate}>Updated: {lastUpdate}</Text>

        {/* Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Live Metrics</Text>
          <MetricCard
            title="Heart Rate"
            value={metrics.heart_rate_bpm}
            unit="BPM"
            icon="❤️"
            gradient={Colors.dark.gradient.heartRate}
            progress={metrics.heart_rate_bpm / 200}
          />
          <MetricCard
            title="HRV (RMSSD)"
            value={metrics.hrv_rmssd.toFixed(1)}
            unit="ms"
            icon="📊"
            gradient={Colors.dark.gradient.hrv}
            progress={metrics.hrv_rmssd / 100}
          />
          <MetricCard
            title="Signal Quality"
            value={(metrics.signal_quality * 100).toFixed(0)}
            unit="%"
            icon="📡"
            gradient={Colors.dark.gradient.quality}
            progress={metrics.signal_quality}
          />
          <MetricCard
            title="Device Status"
            value={status === 'active' ? 'Active' : 'Inactive'}
            unit=""
            icon="✓"
            gradient={Colors.dark.gradient.status}
            progress={status === 'active' ? 1 : 0}
          />
        </View>

        {/* ECG Waveforms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ECG Waveforms</Text>
          <ECGChart
            title="Lead I"
            data={waveform.channel_1}
            color={Colors.dark.chart.red}
          />
          <ECGChart
            title="Lead II"
            data={waveform.channel_2}
            color={Colors.dark.chart.purple}
          />
          <ECGChart
            title="Lead III"
            data={waveform.channel_3}
            color={Colors.dark.chart.cyan}
          />
        </View>

        {/* Medical Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            ⚠️ This is NOT a medical device. For educational purposes only.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.dark.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: Colors.dark.error,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.dark.text,
  },
  lastUpdate: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 16,
  },
  disclaimer: {
    backgroundColor: Colors.dark.warning + '20',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.dark.warning + '40',
  },
  disclaimerText: {
    fontSize: 12,
    color: Colors.dark.warning,
    textAlign: 'center',
    lineHeight: 18,
  },
});
