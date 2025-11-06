import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppSelector } from '@/state/hooks';
import { Colors } from '@/constants/Colors';
import type { ConnectionState } from '@/types';

interface ConnectionStatusProps {
  compact?: boolean;
}

export function ConnectionStatus({ compact = false }: ConnectionStatusProps) {
  const ble = useAppSelector((state) => state.connection.ble);
  const cloud = useAppSelector((state) => state.connection.cloud);

  const getStatusColor = (state: ConnectionState): string => {
    switch (state) {
      case 'connected':
        return Colors.dark.success;
      case 'connecting':
        return Colors.dark.warning;
      case 'error':
        return Colors.dark.error;
      default:
        return Colors.dark.textSecondary;
    }
  };

  const getStatusIcon = (state: ConnectionState): string => {
    switch (state) {
      case 'connected':
        return '●';
      case 'connecting':
        return '◐';
      case 'error':
        return '✕';
      default:
        return '○';
    }
  };

  const getStatusText = (state: ConnectionState): string => {
    switch (state) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting';
      case 'error':
        return 'Error';
      default:
        return 'Disconnected';
    }
  };

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactStatus}>
          <Text style={[styles.statusIcon, { color: getStatusColor(ble.state) }]}>
            {getStatusIcon(ble.state)}
          </Text>
          <Text style={styles.compactLabel}>BLE</Text>
        </View>
        <View style={styles.compactStatus}>
          <Text style={[styles.statusIcon, { color: getStatusColor(cloud.state) }]}>
            {getStatusIcon(cloud.state)}
          </Text>
          <Text style={styles.compactLabel}>Cloud</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* BLE Status */}
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Text style={styles.statusTitle}>Bluetooth</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ble.state) + '20' }]}>
            <Text style={[styles.statusBadgeText, { color: getStatusColor(ble.state) }]}>
              {getStatusText(ble.state)}
            </Text>
          </View>
        </View>
        {ble.deviceName && (
          <Text style={styles.statusDetail}>Device: {ble.deviceName}</Text>
        )}
        {ble.rssi && (
          <Text style={styles.statusDetail}>Signal: {ble.rssi} dBm</Text>
        )}
        {ble.lastConnected && (
          <Text style={styles.statusDetail}>
            Last connected: {new Date(ble.lastConnected).toLocaleTimeString()}
          </Text>
        )}
      </View>

      {/* Cloud Status */}
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Text style={styles.statusTitle}>Cloud</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(cloud.state) + '20' }]}>
            <Text style={[styles.statusBadgeText, { color: getStatusColor(cloud.state) }]}>
              {getStatusText(cloud.state)}
            </Text>
          </View>
        </View>
        {cloud.lastSync && (
          <Text style={styles.statusDetail}>
            Last sync: {new Date(cloud.lastSync).toLocaleTimeString()}
          </Text>
        )}
        {cloud.queuedBatches > 0 && (
          <Text style={[styles.statusDetail, { color: Colors.dark.warning }]}>
            {cloud.queuedBatches} batches queued
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  compactStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactLabel: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    fontWeight: '500',
  },
  statusIcon: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusDetail: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    marginTop: 4,
  },
});
