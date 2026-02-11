# OneSignal Push Notifications Setup

✅ **OneSignal is already installed and configured!**

Real-time notifications (Socket.io) work when the app is open. **OneSignal** sends push when the app is closed/backgrounded, just like Twitter.

---

## ✅ What's Already Done

- ✅ OneSignal SDK installed (`react-native-onesignal": "^5.3.1"`)
- ✅ OneSignal service created (`src/services/onesignal.ts`)
- ✅ App.tsx initializes OneSignal on app start
- ✅ UserContext links user ID on login/logout
- ✅ Notification permission modal shows after login
- ✅ Backend sends OneSignal push notifications

For iOS (if you haven't run this):
```bash
cd ios && pod install && cd ..
```

---

## 2. OneSignal Dashboard

1. Go to [OneSignal.com](https://onesignal.com) and create an app (or use existing).
2. Get **App ID** and **REST API Key** from Settings > Keys & IDs.
3. Add your **iOS Push Certificate** (Apple Developer → APNs) and **Firebase Server Key** (FCM for Android).

---

## 3. Add to backend `.env`

```env
ONESIGNAL_APP_ID=your-onesignal-app-id
ONESIGNAL_REST_API_KEY=your-rest-api-key
```

Backend will use these to send push via `https://api.onesignal.com/notifications`.

---

## 4. Update OneSignal App ID

**In `src/services/onesignal.ts` line 11:**

```tsx
const ONESIGNAL_APP_ID = 'your-actual-onesignal-app-id';
```

Replace with your app ID from step 2.

Currently using ThreadTrain's ID for testing:
```tsx
const ONESIGNAL_APP_ID = '63af553f-4dfb-449d-9f22-38d6e006094b';
```

---

## 5. ✅ Everything Else is Auto-Configured

The following happens automatically (already implemented):

- ✅ OneSignal initializes on app start (`App.tsx`)
- ✅ User ID links on login (`UserContext → oneSignalService.setUserId()`)
- ✅ User ID unlinks on logout (`UserContext → oneSignalService.removeUserId()`)
- ✅ Permission modal shows 1.5s after login (`FeedScreen.tsx`)
- ✅ Permission requested when user taps "Allow" (`oneSignalService.requestPermission()`)

---

## 8. Handle incoming notifications (optional)

```tsx
OneSignal.Notifications.addEventListener('click', (event) => {
  const data = event.notification.additionalData;
  // e.g. navigate to tweet detail or profile using data.type, data.tweetId, etc.
});
```

---

## 9. Test

1. Backend sends push when someone likes/follows/retweets.
2. Open the app, log in, allow notifications.
3. Log out, log in as a different user, like/follow the first user's tweet.
4. First user should get a push on their device (even if app is closed).

---

## Summary

- Backend: OneSignal REST API via `pushNotifications.js`.
- App: `react-native-onesignal` SDK, initialize with app ID, `OneSignal.login(userId)` on login, request permission.
- When app is **open**: Socket.io (instant, in-app badge).
- When app is **closed**: OneSignal (device push).

Enjoy your Twitter-style notifications.
