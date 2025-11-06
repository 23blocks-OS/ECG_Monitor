import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, ActivityIndicator, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { useAppSelector, useAppDispatch } from '@/state/hooks';
import { setSettings, setAutoUpload, setUseWifiOnly, setNotificationsEnabled, setDataRetentionDays } from '@/state/slices/settingsSlice';
import { setBLEDevice } from '@/state/slices/connectionSlice';
import BLEService from '@/services/BLEService';
import CloudService from '@/services/CloudService';
import StorageService from '@/services/StorageService';
import type { BLEDevice } from '@/types';

export default function SettingsScreen() {
  const dispatch = useAppDispatch();
  const settings = useAppSelector((state) => state.settings);
  const bleConnection = useAppSelector((state) => state.connection.ble);
  const [isScanning, setIsScanning] = useState(false);
  const [availableDevices, setAvailableDevices] = useState<BLEDevice[]>([]);
  const [cacheSize, setCacheSize] = useState(0);
  const [queuedBatches, setQueuedBatches] = useState(0);

  useEffect(() => {
    loadStorageStats();
  }, []);

  const loadStorageStats = async () => {
    const stats = await StorageService.getStorageStats();
    setCacheSize(stats.cacheSizeMB);
    setQueuedBatches(stats.queuedCount);
  };

  const handleOpenGitHub = () => {
    Linking.openURL('https://github.com/23blocks-OS/ECG_Monitor');
  };

  const handleScanDevices = async () => {
    try {
      setIsScanning(true);
      setAvailableDevices([]);

      BLEService.onDeviceFound((devices) => {
        setAvailableDevices(devices);
      });

      const devices = await BLEService.scanForDevices(10000);
      setAvailableDevices(devices);
    } catch (error) {
      console.error('Scan error:', error);
      Alert.alert('Scan Error', 'Failed to scan for devices. Please check Bluetooth permissions.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleConnectDevice = async (device: BLEDevice) => {
    try {
      Alert.alert(
        'Connect Device',
        `Connect to ${device.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Connect',
            onPress: async () => {
              try {
                await BLEService.connectToDevice(device.id);
                await BLEService.startDataStream();
                dispatch(setBLEDevice({ id: device.id, name: device.name }));
                Alert.alert('Success', `Connected to ${device.name}`);
              } catch (error) {
                Alert.alert('Connection Error', 'Failed to connect to device');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Connection error:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await BLEService.disconnect();
      Alert.alert('Disconnected', 'Device disconnected successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to disconnect');
    }
  };

  const handleClearCache = async () => {
    Alert.alert(
      'Clear Cache',
      'This will delete all locally stored ECG data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await StorageService.clearAllBatches();
            await loadStorageStats();
            Alert.alert('Success', 'Cache cleared');
          }
        }
      ]
    );
  };

  const handleProcessQueue = async () => {
    try {
      await CloudService.processOfflineQueue();
      await loadStorageStats();
      Alert.alert('Success', 'Upload queue processed');
    } catch (error) {
      Alert.alert('Error', 'Failed to process upload queue');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Connection Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connection Status</Text>
          <ConnectionStatus />
        </View>

        {/* Bluetooth Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bluetooth Device</Text>
          <View style={styles.card}>
            {bleConnection.deviceName ? (
              <>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Connected Device</Text>
                  <Text style={styles.infoValue}>{bleConnection.deviceName}</Text>
                </View>
                <View style={styles.divider} />
                <TouchableOpacity style={styles.button} onPress={handleDisconnect}>
                  <Text style={styles.buttonText}>Disconnect</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.infoLabel}>No device connected</Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.scanButton, isScanning && styles.scanButtonDisabled]}
            onPress={handleScanDevices}
            disabled={isScanning}
          >
            {isScanning ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.scanButtonText}>Scan for Devices</Text>
            )}
          </TouchableOpacity>

          {availableDevices.length > 0 && (
            <View style={[styles.card, { marginTop: 12 }]}>
              <Text style={styles.deviceListTitle}>Available Devices:</Text>
              {availableDevices.map((device) => (
                <TouchableOpacity
                  key={device.id}
                  style={styles.deviceItem}
                  onPress={() => handleConnectDevice(device)}
                >
                  <Text style={styles.deviceName}>{device.name}</Text>
                  <Text style={styles.deviceRssi}>{device.rssi} dBm</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Cloud Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cloud Settings</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Auto Upload</Text>
              <Switch
                value={settings.autoUpload}
                onValueChange={(value) => {
                  dispatch(setAutoUpload(value));
                  StorageService.saveSettings({ autoUpload: value });
                }}
                trackColor={{ false: Colors.dark.border, true: Colors.dark.primary }}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>WiFi Only</Text>
              <Switch
                value={settings.useWifiOnly}
                onValueChange={(value) => {
                  dispatch(setUseWifiOnly(value));
                  StorageService.saveSettings({ useWifiOnly: value });
                }}
                trackColor={{ false: Colors.dark.border, true: Colors.dark.primary }}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>AWS Region</Text>
              <Text style={styles.infoValue}>{settings.awsRegion}</Text>
            </View>
          </View>
        </View>

        {/* General Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General Settings</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Notifications</Text>
              <Switch
                value={settings.notificationsEnabled}
                onValueChange={(value) => {
                  dispatch(setNotificationsEnabled(value));
                  StorageService.saveSettings({ notificationsEnabled: value });
                }}
                trackColor={{ false: Colors.dark.border, true: Colors.dark.primary }}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Data Retention</Text>
              <Text style={styles.infoValue}>{settings.dataRetentionDays} days</Text>
            </View>
          </View>
        </View>

        {/* Storage */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Storage</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Cache Size</Text>
              <Text style={styles.infoValue}>{cacheSize.toFixed(2)} MB</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Queued Batches</Text>
              <Text style={styles.infoValue}>{queuedBatches}</Text>
            </View>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.button} onPress={handleClearCache}>
              <Text style={styles.buttonText}>Clear Cache</Text>
            </TouchableOpacity>
            {queuedBatches > 0 && (
              <>
                <View style={styles.divider} />
                <TouchableOpacity style={styles.button} onPress={handleProcessQueue}>
                  <Text style={styles.buttonText}>Process Upload Queue</Text>
                </TouchableOpacity>
              </>
            )}
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
  button: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 15,
    color: Colors.dark.primary,
    fontWeight: '600',
  },
  scanButton: {
    backgroundColor: Colors.dark.primary,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  scanButtonDisabled: {
    opacity: 0.5,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deviceListTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 12,
  },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  deviceName: {
    fontSize: 15,
    color: Colors.dark.text,
    fontWeight: '500',
  },
  deviceRssi: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
});
