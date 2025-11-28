import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { auth } from './firebase';
import { doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Notification types
export interface NotificationData {
  type: 'new_message' | 'help_accepted' | 'help_completed' | 'new_request_nearby';
  title: string;
  body: string;
  data?: Record<string, any>;
  requestId?: string;
  chatId?: string;
  fromUserId?: string;
}

export class NotificationService {
  private static instance: NotificationService;
  private pushToken: string | null = null;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Request notification permissions
  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        const { status } = await Notifications.requestPermissionsAsync();
        return status === 'granted';
      } else {
        const { status } = await Notifications.requestPermissionsAsync();
        return status === 'granted' || status === 'undetermined';
      }
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  // Get notification permissions status
  async getPermissionsStatus(): Promise<boolean> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error getting notification permissions:', error);
      return false;
    }
  }

  // Register for push notifications
  async registerForPushNotifications(): Promise<string | null> {
    try {
      // Request permissions first
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('Notification permissions not granted');
        return null;
      }

      // Get push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-expo-project-id', // You'll need to set this in app.json
      });

      this.pushToken = tokenData.data;
      console.log('Push token registered:', this.pushToken);

      // Save token to Firestore for the current user
      if (auth.currentUser) {
        await this.savePushTokenToDatabase(auth.currentUser.uid, this.pushToken);
      }

      return this.pushToken;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  // Save push token to user document
  private async savePushTokenToDatabase(userId: string, token: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        await updateDoc(userRef, {
          pushToken: token,
          notificationEnabled: true,
          updatedAt: new Date(),
        });
      } else {
        await setDoc(userRef, {
          pushToken: token,
          notificationEnabled: true,
          createdAt: new Date(),
        });
      }
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  }

  // Send local notification (for testing or immediate feedback)
  async sendLocalNotification(notification: NotificationData): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: 'default',
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Error sending local notification:', error);
    }
  }

  // Schedule notification for later
  async scheduleNotification(
    notification: NotificationData,
    trigger: Notifications.NotificationTriggerInput
  ): Promise<string | null> {
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: 'default',
        },
        trigger,
      });
      return identifier;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  // Cancel scheduled notification
  async cancelNotification(identifier: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  // Get all scheduled notifications
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  // Dismiss all notifications
  async dismissAllNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
    } catch (error) {
      console.error('Error dismissing notifications:', error);
    }
  }

  // Get notification count (badge count)
  async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Error getting badge count:', error);
      return 0;
    }
  }

  // Set badge count
  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }

  // Handle notification responses (when user taps notification)
  handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const data = response.notification.request.content.data;
    
    console.log('Notification tapped:', data);
    
    // Handle different notification types
    if (data.type === 'new_message' && data.chatId) {
      // Navigate to chat screen
      // You'll need to integrate this with your navigation
      console.log('Navigate to chat:', data.chatId);
    } else if (data.type === 'help_accepted' && data.requestId) {
      // Navigate to request details
      console.log('Navigate to request:', data.requestId);
    }
    // Add more handlers as needed
  }

  // Initialize notification service
  async initialize(): Promise<void> {
    try {
      // Check if we're on a physical device
      if (!Constants.isDevice) {
        console.log('Notifications are not supported on simulator');
        return;
      }

      // Register for push notifications
      await this.registerForPushNotifications();

      // Set up notification response listener
      Notifications.addNotificationResponseReceivedListener(
        this.handleNotificationResponse.bind(this)
      );

      console.log('Notification service initialized');
    } catch (error) {
      console.error('Error initializing notification service:', error);
    }
  }

  // Enable/disable notifications for user
  async toggleUserNotifications(enabled: boolean): Promise<void> {
    try {
      if (auth.currentUser) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userRef, {
          notificationEnabled: enabled,
          updatedAt: new Date(),
        });

        if (!enabled && this.pushToken) {
          // Optionally clear the push token when disabled
          await updateDoc(userRef, {
            pushToken: null,
          });
          this.pushToken = null;
        } else if (enabled && !this.pushToken) {
          // Re-register when re-enabled
          await this.registerForPushNotifications();
        }
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
    }
  }

  // Get current push token
  getPushToken(): string | null {
    return this.pushToken;
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();

// Helper functions for common notification types
export const notificationHelpers = {
  // New message notification
  newMessage: (senderName: string, message: string, chatId: string): NotificationData => ({
    type: 'new_message',
    title: `New message from ${senderName}`,
    body: message,
    data: { chatId, type: 'new_message' },
  }),

  // Help request accepted notification
  helpAccepted: (helperName: string, requestId: string): NotificationData => ({
    type: 'help_accepted',
    title: 'Help Accepted!',
    body: `${helperName} has accepted to help with your request`,
    data: { requestId, type: 'help_accepted' },
  }),

  // Help request completed notification
  helpCompleted: (helperName: string, requestId: string): NotificationData => ({
    type: 'help_completed',
    title: 'Request Completed!',
    body: `${helperName} has marked your request as completed`,
    data: { requestId, type: 'help_completed' },
  }),

  // New nearby request notification
  newNearbyRequest: (title: string, distance: string, requestId: string): NotificationData => ({
    type: 'new_request_nearby',
    title: 'New Request Nearby!',
    body: `${title} - ${distance} away`,
    data: { requestId, type: 'new_request_nearby' },
  }),
};
