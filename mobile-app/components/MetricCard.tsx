import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit: string;
  icon: string;
  gradient: string[];
  progress?: number;
}

export function MetricCard({ title, value, unit, icon, gradient, progress = 0 }: MetricCardProps) {
  return (
    <View style={styles.card}>
      <LinearGradient
        colors={[gradient[0] + '20', gradient[1] + '10']}
        style={styles.cardGradient}
      >
        <View style={styles.header}>
          <View style={[styles.iconBadge, { backgroundColor: gradient[0] + '30' }]}>
            <Text style={styles.icon}>{icon}</Text>
          </View>
          <Text style={styles.title}>{title}</Text>
        </View>

        <View style={styles.valueContainer}>
          <Text style={styles.value}>{value}</Text>
          <Text style={styles.unit}>{unit}</Text>
        </View>

        {progress > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${progress * 100}%` }]}
              />
            </View>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  cardGradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  title: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    fontWeight: '600',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  value: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginRight: 6,
  },
  unit: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    fontWeight: '600',
  },
  progressContainer: {
    marginTop: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.dark.surfaceLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
});
