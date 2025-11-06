import { BleManager, Device, Characteristic } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid } from 'react-native';
import * as pako from 'pako';
import type { BLEDevice, ECGBatch, BLEChunk } from '@/types';
import StorageService from './StorageService';

/**
 * BLEService - Bluetooth Low Energy communication with Raspberry Pi
 * Handles:
 * - Device scanning and connection
 * - Data streaming from Pi
 * - Chunked data reassembly
 * - Auto-reconnection
 */
class BLEService {
  private static instance: BLEService;
  private manager: BleManager;
  private connectedDevice: Device | null = null;
  private reconnectInterval: NodeJS.Timeout | null = null;
  private isScanning: boolean = false;
  private chunkBuffer: Map<string, BLEChunk[]> = new Map();

  // UUIDs matching Pi implementation (from architecture doc)
  private readonly SERVICE_UUID = '0000181d-0000-1000-8000-00805f9b34fb';
  private readonly DATA_CHAR_UUID = '00002a37-0000-1000-8000-00805f9b34fb';

  // Event handlers
  private onDataReceivedCallback: ((batch: ECGBatch) => void) | null = null;
  private onConnectionLostCallback: (() => void) | null = null;
  private onConnectionEstablishedCallback: ((device: Device) => void) | null = null;
  private onDeviceFoundCallback: ((devices: BLEDevice[]) => void) | null = null;

  private constructor() {
    this.manager = new BleManager();
    this.setupStateListener();
  }

  static getInstance(): BLEService {
    if (!BLEService.instance) {
      BLEService.instance = new BLEService();
    }
    return BLEService.instance;
  }

  /**
   * Setup Bluetooth state listener
   */
  private setupStateListener(): void {
    this.manager.onStateChange((state) => {
      console.log(`Bluetooth state: ${state}`);
      if (state === 'PoweredOn') {
        console.log('Bluetooth is ready');
      }
    }, true);
  }

  /**
   * Request necessary permissions (Android)
   */
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        if (Platform.Version >= 31) {
          // Android 12+
          const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          ]);

          return (
            granted['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
            granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED &&
            granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED
          );
        } else {
          // Android 11 and below
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
      } catch (error) {
        console.error('Permission request error:', error);
        return false;
      }
    }
    return true; // iOS handles permissions automatically
  }

  /**
   * Scan for ECG devices
   */
  async scanForDevices(durationMs: number = 10000): Promise<BLEDevice[]> {
    const hasPermissions = await this.requestPermissions();
    if (!hasPermissions) {
      throw new Error('Bluetooth permissions not granted');
    }

    const devices: Map<string, BLEDevice> = new Map();
    this.isScanning = true;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.manager.stopDeviceScan();
        this.isScanning = false;
        resolve(Array.from(devices.values()));
      }, durationMs);

      this.manager.startDeviceScan(
        [this.SERVICE_UUID],
        { allowDuplicates: false },
        (error, device) => {
          if (error) {
            clearTimeout(timeout);
            this.isScanning = false;
            reject(error);
            return;
          }

          if (device && device.name) {
            const bleDevice: BLEDevice = {
              id: device.id,
              name: device.name,
              rssi: device.rssi || -100,
            };
            devices.set(device.id, bleDevice);

            // Notify callback with updated list
            if (this.onDeviceFoundCallback) {
              this.onDeviceFoundCallback(Array.from(devices.values()));
            }
          }
        }
      );
    });
  }

  /**
   * Stop scanning
   */
  stopScan(): void {
    if (this.isScanning) {
      this.manager.stopDeviceScan();
      this.isScanning = false;
    }
  }

  /**
   * Connect to a device
   */
  async connectToDevice(deviceId: string): Promise<void> {
    try {
      console.log(`Connecting to device: ${deviceId}`);

      // Disconnect if already connected
      if (this.connectedDevice) {
        await this.disconnect();
      }

      // Connect to device
      const device = await this.manager.connectToDevice(deviceId, {
        timeout: 10000,
      });

      console.log(`Connected to ${device.name}`);

      // Discover services and characteristics
      await device.discoverAllServicesAndCharacteristics();

      this.connectedDevice = device;

      // Setup disconnect listener
      device.onDisconnected((error, disconnectedDevice) => {
        console.log(`Device ${disconnectedDevice?.name} disconnected`);
        this.connectedDevice = null;

        if (this.onConnectionLostCallback) {
          this.onConnectionLostCallback();
        }

        // Auto-reconnect
        this.startAutoReconnect(deviceId);
      });

      // Notify connection established
      if (this.onConnectionEstablishedCallback) {
        this.onConnectionEstablishedCallback(device);
      }

      // Save device ID to settings
      await StorageService.saveSettings({
        bleDeviceId: deviceId,
        bleDeviceName: device.name || undefined,
      });
    } catch (error) {
      console.error('Connection error:', error);
      throw error;
    }
  }

  /**
   * Start receiving data from the device
   */
  async startDataStream(): Promise<void> {
    if (!this.connectedDevice) {
      throw new Error('No device connected');
    }

    try {
      console.log('Starting data stream...');

      // Subscribe to characteristic notifications
      this.connectedDevice.monitorCharacteristicForService(
        this.SERVICE_UUID,
        this.DATA_CHAR_UUID,
        (error, characteristic) => {
          if (error) {
            console.error('Monitor error:', error);
            return;
          }

          if (characteristic?.value) {
            this.handleIncomingData(characteristic);
          }
        }
      );

      console.log('Data stream started');
    } catch (error) {
      console.error('Error starting data stream:', error);
      throw error;
    }
  }

  /**
   * Handle incoming data from BLE characteristic
   */
  private handleIncomingData(characteristic: Characteristic): void {
    try {
      if (!characteristic.value) return;

      // Decode base64 data
      const data = Buffer.from(characteristic.value, 'base64');

      // Parse chunk header
      const chunk: BLEChunk = {
        seq: data.readUInt16LE(0),
        total: data.readUInt16LE(2),
        dataLength: data.readUInt16LE(4),
        data: data.slice(6),
      };

      console.log(`Received chunk ${chunk.seq + 1}/${chunk.total}`);

      // Get or create chunk buffer for this batch
      const batchKey = `${characteristic.deviceID}_${Date.now()}`;
      let chunks = this.chunkBuffer.get(batchKey) || [];
      chunks.push(chunk);
      this.chunkBuffer.set(batchKey, chunks);

      // Check if we have all chunks
      if (chunks.length === chunk.total) {
        this.reassembleAndProcessBatch(chunks);
        this.chunkBuffer.delete(batchKey);
      }
    } catch (error) {
      console.error('Error handling incoming data:', error);
    }
  }

  /**
   * Reassemble chunks and process the complete batch
   */
  private reassembleAndProcessBatch(chunks: BLEChunk[]): void {
    try {
      // Sort chunks by sequence number
      chunks.sort((a, b) => a.seq - b.seq);

      // Concatenate all chunk data
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.dataLength, 0);
      const completeData = Buffer.alloc(totalLength);
      let offset = 0;

      for (const chunk of chunks) {
        chunk.data.copy(completeData, offset, 0, chunk.dataLength);
        offset += chunk.dataLength;
      }

      // Decompress data (assuming gzip compression)
      const decompressed = pako.inflate(completeData, { to: 'string' });

      // Parse JSON
      const batch: ECGBatch = JSON.parse(decompressed);

      console.log(`Received complete batch: ${batch.batch_id}`);

      // Save to storage
      StorageService.saveBatch(batch);

      // Notify callback
      if (this.onDataReceivedCallback) {
        this.onDataReceivedCallback(batch);
      }
    } catch (error) {
      console.error('Error reassembling batch:', error);
    }
  }

  /**
   * Disconnect from device
   */
  async disconnect(): Promise<void> {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }

    if (this.connectedDevice) {
      try {
        await this.manager.cancelDeviceConnection(this.connectedDevice.id);
        console.log('Disconnected from device');
      } catch (error) {
        console.error('Disconnect error:', error);
      }
      this.connectedDevice = null;
    }
  }

  /**
   * Start auto-reconnect attempts
   */
  private startAutoReconnect(deviceId: string): void {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
    }

    console.log('Starting auto-reconnect...');

    this.reconnectInterval = setInterval(async () => {
      try {
        console.log('Attempting to reconnect...');
        await this.connectToDevice(deviceId);

        if (this.connectedDevice) {
          await this.startDataStream();
          if (this.reconnectInterval) {
            clearInterval(this.reconnectInterval);
            this.reconnectInterval = null;
          }
        }
      } catch (error) {
        console.log('Reconnect attempt failed, will retry...');
      }
    }, 5000); // Retry every 5 seconds
  }

  /**
   * Check if device is connected
   */
  isConnected(): boolean {
    return this.connectedDevice !== null;
  }

  /**
   * Get connected device info
   */
  getConnectedDevice(): Device | null {
    return this.connectedDevice;
  }

  /**
   * Get RSSI (signal strength) of connected device
   */
  async getRSSI(): Promise<number | null> {
    if (!this.connectedDevice) return null;

    try {
      const rssi = await this.connectedDevice.readRSSI();
      return rssi;
    } catch (error) {
      console.error('Error reading RSSI:', error);
      return null;
    }
  }

  // ========== Event Handlers ==========

  onDataReceived(callback: (batch: ECGBatch) => void): void {
    this.onDataReceivedCallback = callback;
  }

  onConnectionLost(callback: () => void): void {
    this.onConnectionLostCallback = callback;
  }

  onConnectionEstablished(callback: (device: Device) => void): void {
    this.onConnectionEstablishedCallback = callback;
  }

  onDeviceFound(callback: (devices: BLEDevice[]) => void): void {
    this.onDeviceFoundCallback = callback;
  }

  // ========== Cleanup ==========

  destroy(): void {
    this.disconnect();
    this.manager.destroy();
  }
}

export default BLEService.getInstance();
