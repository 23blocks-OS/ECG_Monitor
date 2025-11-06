import { device as awsIotDevice } from 'aws-iot-device-sdk';
import * as pako from 'pako';
import NetInfo from '@react-native-community/netinfo';
import type { ECGBatch, AWSCredentials } from '@/types';
import StorageService from './StorageService';

/**
 * CloudService - AWS IoT MQTT communication
 * Handles:
 * - AWS IoT connection
 * - Batch uploading with compression
 * - Offline queue management
 * - Network-aware uploads
 * - Alert subscriptions
 */
class CloudService {
  private static instance: CloudService;
  private mqttClient: any = null;
  private isConnected: boolean = false;
  private isUploading: boolean = false;
  private uploadRetryCount: Map<string, number> = new Map();
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 2000;

  // Event handlers
  private onAlertCallback: ((alert: any) => void) | null = null;
  private onConnectionChangedCallback: ((connected: boolean) => void) | null = null;
  private onUploadSuccessCallback: ((batchId: string) => void) | null = null;
  private onUploadErrorCallback: ((batchId: string, error: Error) => void) | null = null;

  // Network state
  private isOnline: boolean = true;
  private isWifiConnected: boolean = false;

  private constructor() {
    this.setupNetworkListener();
  }

  static getInstance(): CloudService {
    if (!CloudService.instance) {
      CloudService.instance = new CloudService();
    }
    return CloudService.instance;
  }

  /**
   * Setup network state listener
   */
  private setupNetworkListener(): void {
    NetInfo.addEventListener(state => {
      this.isOnline = state.isConnected ?? false;
      this.isWifiConnected = state.type === 'wifi';

      console.log(`Network state: ${state.type}, Connected: ${this.isOnline}`);

      // Process offline queue when connection is restored
      if (this.isOnline && this.isConnected) {
        this.processOfflineQueue();
      }
    });
  }

  /**
   * Connect to AWS IoT
   */
  async connect(credentials: AWSCredentials): Promise<void> {
    try {
      console.log('Connecting to AWS IoT...');

      // For React Native, we'll use a simpler HTTP/HTTPS based approach
      // since the full aws-iot-device-sdk has issues with React Native
      // In production, you'd use AWS IoT Core with WebSockets or a proxy

      // Mock connection for now - in production, implement with AWS IoT MQTT over WebSockets
      this.isConnected = true;

      if (this.onConnectionChangedCallback) {
        this.onConnectionChangedCallback(true);
      }

      console.log('Connected to AWS IoT (Mock Mode)');

      // Subscribe to alerts topic
      this.subscribeToAlerts();

    } catch (error) {
      console.error('AWS IoT connection error:', error);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Disconnect from AWS IoT
   */
  async disconnect(): Promise<void> {
    if (this.mqttClient) {
      try {
        await new Promise<void>((resolve) => {
          this.mqttClient.end(() => resolve());
        });
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    }

    this.isConnected = false;
    if (this.onConnectionChangedCallback) {
      this.onConnectionChangedCallback(false);
    }
    console.log('Disconnected from AWS IoT');
  }

  /**
   * Upload a batch to AWS
   */
  async uploadBatch(batch: ECGBatch): Promise<boolean> {
    try {
      const settings = await StorageService.loadSettings();

      // Check network conditions
      if (!this.isOnline) {
        console.log('Offline - queueing batch for later upload');
        await this.queueBatchForLater(batch);
        return false;
      }

      if (settings.useWifiOnly && !this.isWifiConnected) {
        console.log('WiFi-only mode - queueing batch for later upload');
        await this.queueBatchForLater(batch);
        return false;
      }

      // Compress data before upload
      const jsonData = JSON.stringify(batch);
      const compressed = pako.gzip(jsonData);

      console.log(`Uploading batch ${batch.batch_id} (${compressed.length} bytes)`);

      // Mock upload - in production, publish to AWS IoT MQTT topic or upload to S3
      await this.mockUpload(batch.batch_id, compressed);

      console.log(`Successfully uploaded batch ${batch.batch_id}`);

      // Remove from retry map
      this.uploadRetryCount.delete(batch.batch_id);

      // Notify success
      if (this.onUploadSuccessCallback) {
        this.onUploadSuccessCallback(batch.batch_id);
      }

      return true;
    } catch (error) {
      console.error(`Error uploading batch ${batch.batch_id}:`, error);

      // Track retry count
      const retries = this.uploadRetryCount.get(batch.batch_id) || 0;

      if (retries < this.MAX_RETRIES) {
        this.uploadRetryCount.set(batch.batch_id, retries + 1);
        await StorageService.incrementRetryCount(batch.batch_id);

        // Retry with exponential backoff
        setTimeout(() => {
          this.uploadBatch(batch);
        }, this.RETRY_DELAY_MS * Math.pow(2, retries));
      } else {
        console.error(`Max retries reached for batch ${batch.batch_id}`);
        this.uploadRetryCount.delete(batch.batch_id);

        if (this.onUploadErrorCallback) {
          this.onUploadErrorCallback(batch.batch_id, error as Error);
        }
      }

      return false;
    }
  }

  /**
   * Mock upload function - replace with actual AWS IoT publish or S3 upload
   */
  private async mockUpload(batchId: string, data: Uint8Array): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // In production, this would be:
    // - Publish to AWS IoT topic: `ecg/device/${deviceId}/data`
    // - Or upload to S3 bucket with presigned URL
    // - Or call API Gateway endpoint

    console.log(`Mock uploaded ${data.length} bytes for batch ${batchId}`);
  }

  /**
   * Queue batch for later upload
   */
  async queueBatchForLater(batch: ECGBatch): Promise<void> {
    try {
      await StorageService.queueBatchForUpload(batch);
      console.log(`Queued batch ${batch.batch_id} for later upload`);
    } catch (error) {
      console.error('Error queueing batch:', error);
      throw error;
    }
  }

  /**
   * Process offline queue
   */
  async processOfflineQueue(): Promise<void> {
    if (this.isUploading) {
      console.log('Already processing queue');
      return;
    }

    try {
      this.isUploading = true;
      const queue = await StorageService.getUploadQueue();

      console.log(`Processing offline queue (${queue.length} items)`);

      for (const item of queue) {
        const success = await this.uploadBatch(item.batch);

        if (success) {
          // Remove from queue
          await StorageService.removeBatchFromQueue(item.batch.batch_id);
        }
      }

      console.log('Finished processing offline queue');
    } catch (error) {
      console.error('Error processing offline queue:', error);
    } finally {
      this.isUploading = false;
    }
  }

  /**
   * Fetch analysis results for a batch
   */
  async fetchAnalysis(batchId: string): Promise<any> {
    try {
      // In production, this would fetch from AWS IoT shadow or DynamoDB
      console.log(`Fetching analysis for batch ${batchId}`);

      // Mock analysis result
      return {
        batch_id: batchId,
        timestamp: Date.now(),
        analysis: {
          rhythm: 'Normal sinus rhythm',
          heart_rate_avg: 72,
          hrv_metrics: {
            rmssd: 42.5,
            sdnn: 50.2,
          },
          anomalies: [],
          confidence: 0.95,
        },
      };
    } catch (error) {
      console.error('Error fetching analysis:', error);
      throw error;
    }
  }

  /**
   * Subscribe to alerts from AWS IoT
   */
  private subscribeToAlerts(): void {
    // In production, subscribe to MQTT topic: `ecg/device/${deviceId}/alerts`
    console.log('Subscribed to alerts topic (Mock Mode)');

    // Mock alert for testing
    setTimeout(() => {
      if (this.onAlertCallback) {
        this.onAlertCallback({
          alert_id: `alert_${Date.now()}`,
          timestamp: Date.now(),
          severity: 'medium',
          summary: 'Irregular rhythm detected',
        });
      }
    }, 30000); // Mock alert after 30 seconds
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): {
    connected: boolean;
    online: boolean;
    wifiConnected: boolean;
  } {
    return {
      connected: this.isConnected,
      online: this.isOnline,
      wifiConnected: this.isWifiConnected,
    };
  }

  /**
   * Get upload queue statistics
   */
  async getQueueStats(): Promise<{
    queuedCount: number;
    totalSize: number;
  }> {
    const queue = await StorageService.getUploadQueue();
    const totalSize = queue.reduce((sum, item) => {
      const batchSize = JSON.stringify(item.batch).length;
      return sum + batchSize;
    }, 0);

    return {
      queuedCount: queue.length,
      totalSize,
    };
  }

  // ========== Event Handlers ==========

  onAlert(callback: (alert: any) => void): void {
    this.onAlertCallback = callback;
  }

  onConnectionChanged(callback: (connected: boolean) => void): void {
    this.onConnectionChangedCallback = callback;
  }

  onUploadSuccess(callback: (batchId: string) => void): void {
    this.onUploadSuccessCallback = callback;
  }

  onUploadError(callback: (batchId: string, error: Error) => void): void {
    this.onUploadErrorCallback = callback;
  }
}

export default CloudService.getInstance();
