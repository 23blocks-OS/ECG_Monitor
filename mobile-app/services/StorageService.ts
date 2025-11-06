import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ECGBatch, UserSettings, UploadQueueItem } from '@/types';

/**
 * StorageService - Local data persistence using AsyncStorage
 * Handles:
 * - ECG batch caching
 * - Upload queue management
 * - User settings
 * - Data cleanup
 */
class StorageService {
  private static instance: StorageService;

  // Storage keys
  private readonly KEYS = {
    BATCHES: '@ecg_batches',
    UPLOAD_QUEUE: '@upload_queue',
    SETTINGS: '@user_settings',
    LAST_CLEANUP: '@last_cleanup',
  };

  // Default settings
  private readonly DEFAULT_SETTINGS: UserSettings = {
    awsRegion: 'us-east-1',
    autoUpload: true,
    useWifiOnly: false,
    dataRetentionDays: 7,
    notificationsEnabled: true,
    refreshIntervalMs: 5000,
  };

  private constructor() {}

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  // ========== ECG Batch Management ==========

  /**
   * Save an ECG batch to local storage
   */
  async saveBatch(batch: ECGBatch): Promise<void> {
    try {
      const batches = await this.loadCachedBatches();
      batches.push(batch);
      await AsyncStorage.setItem(this.KEYS.BATCHES, JSON.stringify(batches));

      // Cleanup old data if needed
      await this.cleanupOldDataIfNeeded();
    } catch (error) {
      console.error('Error saving batch:', error);
      throw error;
    }
  }

  /**
   * Load all cached ECG batches
   */
  async loadCachedBatches(): Promise<ECGBatch[]> {
    try {
      const data = await AsyncStorage.getItem(this.KEYS.BATCHES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading cached batches:', error);
      return [];
    }
  }

  /**
   * Get batches within a time range
   */
  async getBatchesByTimeRange(startTime: number, endTime: number): Promise<ECGBatch[]> {
    const batches = await this.loadCachedBatches();
    return batches.filter(
      batch => batch.start_timestamp >= startTime && batch.start_timestamp <= endTime
    );
  }

  /**
   * Delete batches older than specified days
   */
  async clearOldData(daysToKeep: number): Promise<void> {
    try {
      const batches = await this.loadCachedBatches();
      const cutoffTime = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;

      const recentBatches = batches.filter(
        batch => batch.start_timestamp >= cutoffTime
      );

      await AsyncStorage.setItem(this.KEYS.BATCHES, JSON.stringify(recentBatches));
      await AsyncStorage.setItem(this.KEYS.LAST_CLEANUP, Date.now().toString());

      console.log(`Cleaned up old data. Kept ${recentBatches.length} batches, removed ${batches.length - recentBatches.length}`);
    } catch (error) {
      console.error('Error clearing old data:', error);
      throw error;
    }
  }

  /**
   * Cleanup old data if it's been more than 24 hours since last cleanup
   */
  private async cleanupOldDataIfNeeded(): Promise<void> {
    try {
      const lastCleanup = await AsyncStorage.getItem(this.KEYS.LAST_CLEANUP);
      const lastCleanupTime = lastCleanup ? parseInt(lastCleanup) : 0;
      const hoursSinceCleanup = (Date.now() - lastCleanupTime) / (1000 * 60 * 60);

      if (hoursSinceCleanup >= 24) {
        const settings = await this.loadSettings();
        await this.clearOldData(settings.dataRetentionDays);
      }
    } catch (error) {
      console.error('Error in automatic cleanup:', error);
    }
  }

  /**
   * Get the total size of cached data (approximate)
   */
  async getCacheSize(): Promise<number> {
    try {
      const batches = await this.loadCachedBatches();
      const queue = await this.getUploadQueue();

      const batchesSize = JSON.stringify(batches).length;
      const queueSize = JSON.stringify(queue).length;

      return batchesSize + queueSize; // Size in bytes
    } catch (error) {
      console.error('Error calculating cache size:', error);
      return 0;
    }
  }

  /**
   * Clear all cached batches
   */
  async clearAllBatches(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.KEYS.BATCHES);
      console.log('Cleared all cached batches');
    } catch (error) {
      console.error('Error clearing all batches:', error);
      throw error;
    }
  }

  // ========== Upload Queue Management ==========

  /**
   * Add a batch to the upload queue
   */
  async queueBatchForUpload(batch: ECGBatch): Promise<void> {
    try {
      const queue = await this.getUploadQueue();
      const queueItem: UploadQueueItem = {
        batch,
        timestamp: Date.now(),
        retryCount: 0,
      };
      queue.push(queueItem);
      await AsyncStorage.setItem(this.KEYS.UPLOAD_QUEUE, JSON.stringify(queue));
    } catch (error) {
      console.error('Error queueing batch for upload:', error);
      throw error;
    }
  }

  /**
   * Get all items in the upload queue
   */
  async getUploadQueue(): Promise<UploadQueueItem[]> {
    try {
      const data = await AsyncStorage.getItem(this.KEYS.UPLOAD_QUEUE);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading upload queue:', error);
      return [];
    }
  }

  /**
   * Remove a batch from the upload queue
   */
  async removeBatchFromQueue(batchId: string): Promise<void> {
    try {
      const queue = await this.getUploadQueue();
      const updatedQueue = queue.filter(item => item.batch.batch_id !== batchId);
      await AsyncStorage.setItem(this.KEYS.UPLOAD_QUEUE, JSON.stringify(updatedQueue));
    } catch (error) {
      console.error('Error removing batch from queue:', error);
      throw error;
    }
  }

  /**
   * Increment retry count for a batch in the queue
   */
  async incrementRetryCount(batchId: string): Promise<void> {
    try {
      const queue = await this.getUploadQueue();
      const updatedQueue = queue.map(item =>
        item.batch.batch_id === batchId
          ? { ...item, retryCount: item.retryCount + 1 }
          : item
      );
      await AsyncStorage.setItem(this.KEYS.UPLOAD_QUEUE, JSON.stringify(updatedQueue));
    } catch (error) {
      console.error('Error incrementing retry count:', error);
      throw error;
    }
  }

  /**
   * Clear the entire upload queue
   */
  async clearUploadQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.KEYS.UPLOAD_QUEUE);
      console.log('Cleared upload queue');
    } catch (error) {
      console.error('Error clearing upload queue:', error);
      throw error;
    }
  }

  // ========== User Settings ==========

  /**
   * Save user settings
   */
  async saveSettings(settings: Partial<UserSettings>): Promise<void> {
    try {
      const currentSettings = await this.loadSettings();
      const updatedSettings = { ...currentSettings, ...settings };
      await AsyncStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(updatedSettings));
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }

  /**
   * Load user settings
   */
  async loadSettings(): Promise<UserSettings> {
    try {
      const data = await AsyncStorage.getItem(this.KEYS.SETTINGS);
      return data ? { ...this.DEFAULT_SETTINGS, ...JSON.parse(data) } : this.DEFAULT_SETTINGS;
    } catch (error) {
      console.error('Error loading settings:', error);
      return this.DEFAULT_SETTINGS;
    }
  }

  /**
   * Reset settings to defaults
   */
  async resetSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(this.DEFAULT_SETTINGS));
      console.log('Reset settings to defaults');
    } catch (error) {
      console.error('Error resetting settings:', error);
      throw error;
    }
  }

  // ========== General ==========

  /**
   * Clear all storage (use with caution!)
   */
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        this.KEYS.BATCHES,
        this.KEYS.UPLOAD_QUEUE,
        this.KEYS.SETTINGS,
        this.KEYS.LAST_CLEANUP,
      ]);
      console.log('Cleared all storage');
    } catch (error) {
      console.error('Error clearing all storage:', error);
      throw error;
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    batchCount: number;
    queuedCount: number;
    cacheSizeBytes: number;
    cacheSizeMB: number;
  }> {
    try {
      const batches = await this.loadCachedBatches();
      const queue = await this.getUploadQueue();
      const sizeBytes = await this.getCacheSize();

      return {
        batchCount: batches.length,
        queuedCount: queue.length,
        cacheSizeBytes: sizeBytes,
        cacheSizeMB: parseFloat((sizeBytes / (1024 * 1024)).toFixed(2)),
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return {
        batchCount: 0,
        queuedCount: 0,
        cacheSizeBytes: 0,
        cacheSizeMB: 0,
      };
    }
  }
}

export default StorageService.getInstance();
