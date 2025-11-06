import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import type { ECGAlert } from '@/types';
import StorageService from './StorageService';

/**
 * NotificationService - Push notifications and alerts
 * Handles:
 * - Notification permissions
 * - Local notifications
 * - Alert notifications
 * - Background notifications
 */

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  private static instance: NotificationService;
  private notificationListener: any = null;
  private responseListener: any = null;

  private constructor() {
    this.setupListeners();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Setup notification listeners
   */
  private setupListeners(): void {
    // Listener for notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(
      notification => {
        console.log('Notification received:', notification);
      }
    );

    // Listener for user interactions with notifications
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      response => {
        console.log('Notification response:', response);
        // Handle notification tap - navigate to relevant screen
      }
    );
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const settings = await StorageService.loadSettings();
      if (!settings.notificationsEnabled) {
        return false;
      }

      if (!Device.isDevice) {
        console.log('Notifications only work on physical devices');
        return false;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Notification permission not granted');
        return false;
      }

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('ecg-alerts', {
          name: 'ECG Alerts',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF0000',
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('ecg-status', {
          name: 'ECG Status',
          importance: Notifications.AndroidImportance.LOW,
          sound: null,
        });
      }

      console.log('Notification permissions granted');
      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Show a local notification
   */
  async showNotification(
    title: string,
    body: string,
    data?: any
  ): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: null, // Show immediately
      });

      return notificationId;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }

  /**
   * Show alert notification
   */
  async showAlertNotification(alert: ECGAlert): Promise<void> {
    try {
      const settings = await StorageService.loadSettings();
      if (!settings.notificationsEnabled) {
        return;
      }

      let title = 'ECG Alert';
      let emoji = '⚠️';

      switch (alert.severity) {
        case 'critical':
          title = 'CRITICAL ECG Alert';
          emoji = '🚨';
          break;
        case 'high':
          title = 'High Priority ECG Alert';
          emoji = '⚠️';
          break;
        case 'medium':
          title = 'ECG Alert';
          emoji = '⚡';
          break;
        case 'low':
          title = 'ECG Notice';
          emoji = 'ℹ️';
          break;
      }

      await this.showNotification(
        `${emoji} ${title}`,
        alert.summary,
        {
          type: 'alert',
          alertId: alert.alert_id,
          severity: alert.severity,
        }
      );
    } catch (error) {
      console.error('Error showing alert notification:', error);
    }
  }

  /**
   * Show connection status notification (for foreground service on Android)
   */
  async showConnectionNotification(
    deviceName: string,
    isConnected: boolean
  ): Promise<string | null> {
    try {
      const title = 'ECG Monitor Running';
      const body = isConnected
        ? `Connected to ${deviceName}`
        : 'Connecting to device...';

      return await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { type: 'connection' },
          sound: false,
          priority: Notifications.AndroidNotificationPriority.LOW,
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Error showing connection notification:', error);
      return null;
    }
  }

  /**
   * Update connection notification
   */
  async updateConnectionNotification(
    notificationId: string,
    deviceName: string,
    isConnected: boolean
  ): Promise<void> {
    try {
      await Notifications.dismissNotificationAsync(notificationId);
      await this.showConnectionNotification(deviceName, isConnected);
    } catch (error) {
      console.error('Error updating connection notification:', error);
    }
  }

  /**
   * Show background data relay notification
   */
  async showBackgroundNotification(): Promise<string | null> {
    try {
      return await this.showNotification(
        'ECG Monitor Running',
        'Receiving data from device',
        { type: 'background' }
      );
    } catch (error) {
      console.error('Error showing background notification:', error);
      return null;
    }
  }

  /**
   * Dismiss a notification
   */
  async dismissNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.dismissNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  }

  /**
   * Dismiss all notifications
   */
  async dismissAllNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
    } catch (error) {
      console.error('Error dismissing all notifications:', error);
    }
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  /**
   * Get notification badge count
   */
  async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Error getting badge count:', error);
      return 0;
    }
  }

  /**
   * Set notification badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }

  /**
   * Clear notification badge
   */
  async clearBadge(): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(0);
    } catch (error) {
      console.error('Error clearing badge:', error);
    }
  }

  /**
   * Cleanup listeners
   */
  destroy(): void {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }
}

export default NotificationService.getInstance();
