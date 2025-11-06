import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';

export default function SettingsScreen() {
  const handleOpenGitHub = () => {
    Linking.openURL('https://github.com/23blocks-OS/ECG_Monitor');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Information</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>App Name</Text>
              <Text style={styles.infoValue}>ECG Monitor</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Version</Text>
              <Text style={styles.infoValue}>1.0.0</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Device ID</Text>
              <Text style={styles.infoValue}>ecg-device-001</Text>
            </View>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.settingRow}>
              <Text style={styles.settingLabel}>🔔 Notifications</Text>
              <Text style={styles.settingValue}>Enabled</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.settingRow}>
              <Text style={styles.settingLabel}>🔄 Refresh Interval</Text>
              <Text style={styles.settingValue}>5 seconds</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.settingRow}>
              <Text style={styles.settingLabel}>📊 Data Mode</Text>
              <Text style={styles.settingValue}>Mock Data</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <Text style={styles.aboutText}>
              ECG Monitor is a personal 24/7 heart monitoring system with AI-powered arrhythmia
              detection using Claude API.
            </Text>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.linkButton} onPress={handleOpenGitHub}>
              <Text style={styles.linkText}>🔗 View on GitHub</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Medical Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerTitle}>⚠️ Medical Disclaimer</Text>
          <Text style={styles.disclaimerText}>
            This is NOT a medical device. This app is for educational and demonstration purposes
            only. NOT intended for clinical diagnosis or treatment. Always consult healthcare
            professionals for medical decisions.
          </Text>
        </View>

        {/* Credits */}
        <View style={styles.credits}>
          <Text style={styles.creditsText}>By Juan Pelaez</Text>
          <Text style={styles.creditsSubtext}>Powered by Claude AI & AWS</Text>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 12,
  },
  card: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLabel: {
    fontSize: 15,
    color: Colors.dark.text,
  },
  settingValue: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.dark.border,
    marginVertical: 4,
  },
  aboutText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    lineHeight: 22,
    marginBottom: 8,
  },
  linkButton: {
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 15,
    color: Colors.dark.primary,
    fontWeight: '600',
  },
  disclaimer: {
    backgroundColor: Colors.dark.error + '20',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.dark.error + '40',
  },
  disclaimerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.dark.error,
    marginBottom: 8,
  },
  disclaimerText: {
    fontSize: 13,
    color: Colors.dark.error,
    lineHeight: 20,
  },
  credits: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  creditsText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginBottom: 4,
  },
  creditsSubtext: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
});
