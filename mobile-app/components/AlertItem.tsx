import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ECGAlert } from '@/types';
import { Colors } from '@/constants/Colors';

interface AlertItemProps {
  alert: ECGAlert;
}

const severityConfig = {
  low: {
    color: Colors.dark.alert.low,
    icon: 'ℹ️',
    label: 'Low',
  },
  medium: {
    color: Colors.dark.alert.medium,
    icon: '⚠️',
    label: 'Medium',
  },
  high: {
    color: Colors.dark.alert.high,
    icon: '🔴',
    label: 'High',
  },
  critical: {
    color: Colors.dark.alert.critical,
    icon: '🚨',
    label: 'Critical',
  },
};

function formatTimestamp(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

export function AlertItem({ alert }: AlertItemProps) {
  const config = severityConfig[alert.severity];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: config.color + '20' }]}>
          <Text style={styles.icon}>{config.icon}</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.severity, { color: config.color }]}>{config.label}</Text>
          <Text style={styles.timestamp}>{formatTimestamp(alert.timestamp)}</Text>
        </View>
      </View>
      <Text style={styles.summary}>{alert.summary}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 18,
  },
  headerText: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  severity: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  timestamp: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  summary: {
    fontSize: 14,
    color: Colors.dark.text,
    lineHeight: 20,
  },
});
