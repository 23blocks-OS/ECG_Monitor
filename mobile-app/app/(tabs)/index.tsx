import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useECGData } from '@/hooks/useECGData';
import { MetricCard } from '@/components/MetricCard';
import { ECGChart } from '@/components/ECGChart';
import { Colors } from '@/constants/Colors';

export default function DashboardScreen() {
  const { liveData, isLoading, error, refresh } = useECGData();

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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, status === 'active' && styles.statusActive]} />
            <Text style={styles.statusText}>
              {status === 'active' ? 'Connected' : 'Disconnected'}
            </Text>
          </View>
          <Text style={styles.lastUpdate}>Updated: {lastUpdate}</Text>
        </View>

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
    marginBottom: 24,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.dark.error,
    marginRight: 8,
  },
  statusActive: {
    backgroundColor: Colors.dark.success,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  lastUpdate: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
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
