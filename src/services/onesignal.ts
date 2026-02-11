/**
 * OneSignal Push Notification Service
 * Handles push notifications for Twitter clone (likes, retweets, follows, replies)
 */

import { OneSignal } from 'react-native-onesignal';
import { Platform, PermissionsAndroid } from 'react-native';

// OneSignal App ID (from dashboard: Settings > Keys & IDs)
// TODO: Replace with your Tweet OneSignal App ID
const ONESIGNAL_APP_ID = '63af553f-4dfb-449d-9f22-38d6e006094b'; // Using ThreadTrain ID for now

class OneSignalService {
  private navigationRef: any = null;
  private isInitialized = false;
  private pendingNotification: any = null;

  setNavigationRef(ref: any) {
    this.navigationRef = ref;
    console.log('✅ [OneSignal] Navigation ref set');
    
    // Process pending notification if any
    if (this.pendingNotification && this.navigationRef) {
      console.log('📩 [OneSignal] Processing pending notification...');
      const pendingData = this.pendingNotification;
      this.pendingNotification = null;
      setTimeout(() => {
        this.handleNotificationAction(pendingData);
      }, 300);
    }
  }

  async initialize() {
    console.log('🔔 [OneSignal] Initializing OneSignal...');

    // Check if OneSignal is available
    if (!OneSignal || !OneSignal.initialize) {
      console.warn('⚠️ [OneSignal] OneSignal not available. Run: npm install react-native-onesignal');
      return;
    }

    try {
      // Initialize OneSignal
      console.log('🔔 [OneSignal] Calling OneSignal.initialize()...');
      OneSignal.initialize(ONESIGNAL_APP_ID);

      // Enable verbose logging in dev mode
      if (__DEV__) {
        OneSignal.Debug.setLogLevel(6); // 6 = Verbose
      }

      console.log('✅ [OneSignal] OneSignal.initialize() completed');
      this.isInitialized = true;

      // Android 13+ requires runtime permission
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        console.log('🔔 [OneSignal] Android 13+: Requesting POST_NOTIFICATIONS permission...');
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
        console.log('🔔 [OneSignal] POST_NOTIFICATIONS permission result:', granted);
      }

      // Notification received in foreground
      OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event) => {
        console.log('📩 [OneSignal] Notification received in foreground');
        const notification = event.getNotification();
        notification.display(); // Show notification even when app is open
      });

      // Notification received in background
      OneSignal.Notifications.addEventListener('received', (event) => {
        console.log('📩 [OneSignal] Notification received (background/closed)');
      });

      // Notification clicked/opened
      OneSignal.Notifications.addEventListener('click', (event) => {
        console.log('👆 [OneSignal] Notification clicked');
        const notification = event.notification;
        const data = notification.additionalData;

        if (data) {
          // If navigation not ready, store for later
          if (!this.navigationRef) {
            console.log('⏳ [OneSignal] Navigation ref not ready - storing notification');
            this.pendingNotification = data;
            return;
          }

          // Handle immediately
          this.handleNotificationAction(data);
        }
      });

      console.log('✅ [OneSignal] OneSignal initialized successfully');
    } catch (error) {
      console.error('❌ [OneSignal] Error initializing OneSignal:', error);
    }
  }

  // Link user ID to OneSignal (call after login)
  async setUserId(userId: string) {
    if (!this.isInitialized) {
      console.warn('⚠️ [OneSignal] Not initialized yet, waiting...');
      setTimeout(() => this.setUserId(userId), 1000);
      return;
    }

    if (!OneSignal || !OneSignal.login) {
      console.warn('⚠️ [OneSignal] OneSignal not available');
      return;
    }

    try {
      console.log('🔗 [OneSignal] Linking user to OneSignal:', userId);
      OneSignal.login(userId);
      console.log('✅ [OneSignal] User linked to OneSignal');

      // Log subscription info
      setTimeout(async () => {
        try {
          const pushSubscription = OneSignal.User.pushSubscription;
          const subscriptionId = pushSubscription.getPushSubscriptionId();
          const optedIn = pushSubscription.getOptedIn();
          console.log('📱 [OneSignal] Subscription ID:', subscriptionId);
          console.log('📱 [OneSignal] Opted In:', optedIn);
          console.log('📱 [OneSignal] External User ID:', userId);
        } catch (e) {
          console.error('❌ [OneSignal] Error getting subscription info:', e);
        }
      }, 2000);
    } catch (error) {
      console.error('❌ [OneSignal] Error linking user:', error);
    }
  }

  // Unlink user when logging out
  async removeUserId() {
    if (!OneSignal || !OneSignal.logout) {
      return;
    }
    try {
      console.log('🔓 [OneSignal] Unlinking user from OneSignal');
      OneSignal.logout();
      console.log('✅ [OneSignal] User unlinked from OneSignal');
    } catch (error) {
      console.error('❌ [OneSignal] Error unlinking user:', error);
    }
  }

  // Request notification permission (called from modal "Allow" button)
  async requestPermission() {
    if (!OneSignal || !OneSignal.Notifications) {
      console.warn('⚠️ [OneSignal] OneSignal not available');
      return false;
    }

    try {
      console.log('🔔 [OneSignal] Requesting notification permission...');
      const permissionGranted = await OneSignal.Notifications.requestPermission(true);
      console.log('✅ [OneSignal] Permission granted:', permissionGranted);
      return permissionGranted;
    } catch (error) {
      console.error('❌ [OneSignal] Error requesting permission:', error);
      return false;
    }
  }

  // Handle notification actions (navigation to tweet/profile)
  private handleNotificationAction(data: any) {
    console.log('📩 [OneSignal] Handling notification action:', data);

    if (!this.navigationRef) {
      console.warn('⚠️ [OneSignal] Navigation ref not set - storing notification');
      this.pendingNotification = data;
      return;
    }

    const { type, tweetId, userId } = data;

    switch (type) {
      case 'like':
      case 'retweet':
      case 'reply':
        // Navigate to tweet detail
        if (tweetId) {
          console.log(`✅ [OneSignal] Navigating to tweet: ${tweetId}`);
          this.navigationRef.navigate('TweetDetail', { tweetId });
        }
        break;

      case 'follow':
        // Navigate to user profile
        if (userId) {
          console.log(`✅ [OneSignal] Navigating to profile: ${userId}`);
          this.navigationRef.navigate('UserProfile', { userId });
        }
        break;

      default:
        console.warn(`⚠️ [OneSignal] Unknown notification type: ${type}`);
    }
  }
}

export default new OneSignalService();
