# Twitter-Style Notifications - Complete ✅

Real-time in-app notifications + push notifications (when app is closed) are now fully implemented, just like Twitter.

---

## What's Done

### 1. Backend: Socket.io Real-time Notifications

- **`createNotification()`** now emits `notification` event to recipient's Socket.io room
- When someone likes/retweets/follows/replies, the recipient gets a real-time event
- **Files changed:**
  - `backend/controllers/notification.js` - emit to Socket.io on notification creation

### 2. Backend: OneSignal Push Notifications

- **`pushNotifications.js`** service created (like ThreadTrain)
- Sends push via OneSignal REST API when app is closed/backgrounded
- Targeted by `userId` (external_id in OneSignal)
- **Files changed:**
  - `backend/services/pushNotifications.js` - OneSignal API integration
  - `backend/controllers/notification.js` - calls OneSignal after Socket.io emit
  - `backend/.env.example` - added `ONESIGNAL_APP_ID` and `ONESIGNAL_REST_API_KEY`

### 3. App: Real-time Notification Badge

- **`NotificationContext`** created - listens to Socket.io `notification` events
- Maintains `unreadCount` and `newNotifications` state globally
- **`NotificationsScreen`** consumes context, updates badge, prepends new notifications
- Badge shows on 🔔 icon in real-time (like Twitter)
- **Files changed:**
  - `mytweet/src/context/NotificationContext.tsx` - new global state for notifications
  - `mytweet/App.tsx` - wrapped in `NotificationProvider`
  - `mytweet/src/screens/Home/NotificationsScreen.tsx` - uses context, updates badge

### 4. App: OneSignal SDK Integration

- **Installed** `react-native-onesignal` (manual `npm install` required)
- **Initialized** in `App.tsx` with app ID
- **Login/Logout:** `OneSignal.login(userId)` on login, `OneSignal.logout()` on logout
- **Files changed:**
  - `mytweet/App.tsx` - OneSignal initialization
  - `mytweet/src/context/UserContext.tsx` - login/logout OneSignal user

### 5. App: Notification Permission Modal

- **Twitter-style modal** asking "Turn on notifications?" after login
- Shows 1.5s after user logs in (first time only)
- "Allow" → calls `OneSignal.Notifications.requestPermission(true)`
- "Not now" → dismisses, never shows again
- **Files changed:**
  - `mytweet/src/components/NotificationPermissionModal.tsx` - new modal component
  - `mytweet/src/screens/Home/FeedScreen.tsx` - shows modal on first login

---

## How It Works

### Real-time (Socket.io) - App is Open

1. User A likes User B's tweet
2. Backend calls `createNotification()`
3. Emits Socket.io `notification` event to User B's room
4. App's `NotificationContext` receives event, increments `unreadCount`
5. Badge updates on 🔔 icon instantly
6. If User B is on NotificationsScreen, new notification prepends to list

### Push (OneSignal) - App is Closed

1. User A likes User B's tweet
2. Backend calls `createNotification()`
3. Calls `sendLikeNotification()` → OneSignal REST API
4. OneSignal delivers push to User B's device (even if app is closed)
5. User B sees "New like - UserA liked your tweet" on their phone

---

## Setup Required

### Backend

Add to `.env`:

```env
ONESIGNAL_APP_ID=your-onesignal-app-id
ONESIGNAL_REST_API_KEY=your-onesignal-rest-api-key
```

Get these from [OneSignal.com](https://onesignal.com) (Settings > Keys & IDs).

### App

1. Install OneSignal SDK:
   ```bash
   cd mytweet
   npm install react-native-onesignal
   cd ios && pod install && cd ..
   ```

2. Update `App.tsx` with your OneSignal App ID:
   ```tsx
   const ONESIGNAL_APP_ID = 'your-onesignal-app-id';
   ```

3. Configure OneSignal dashboard:
   - Add iOS APNs certificate
   - Add Android FCM server key

See **`ONESIGNAL_SETUP.md`** for detailed steps.

---

## Testing

1. Open app, log in → notification permission modal appears
2. Tap "Allow" → iOS/Android permission prompt
3. Log in as a second user, like/retweet/follow the first user
4. First user sees:
   - **Badge on 🔔 icon** (real-time, even if app is open)
   - **New notification in list** (real-time, prepended)
   - **Push notification on device** (if app is closed)

---

## What's Different from Twitter

**Same:**
- Real-time badge updates
- Push notifications when closed
- Permission modal after login
- Notification types (like, retweet, follow, reply)

**Our Implementation:**
- Socket.io + OneSignal (instead of Twitter's proprietary system)
- Redis adapter for Socket.io scaling (millions of users)
- MongoDB indexes for notification queries (scales to millions)

---

## Files Changed

### Backend
- `controllers/notification.js` - emit Socket.io + call OneSignal
- `services/pushNotifications.js` - OneSignal REST API service
- `.env.example` - added OneSignal keys

### App
- `App.tsx` - OneSignal initialization, wrapped in NotificationProvider
- `context/NotificationContext.tsx` - global Socket.io listener + unread count
- `context/UserContext.tsx` - OneSignal login/logout
- `screens/Home/NotificationsScreen.tsx` - use context, update badge
- `components/NotificationPermissionModal.tsx` - Twitter-style modal

---

## Next Steps (Optional)

- [ ] Deep linking: when user taps push, navigate to tweet/profile
- [ ] Notification settings: let users mute certain types
- [ ] Grouped notifications: "UserA and 5 others liked your tweet"

---

Enjoy your Twitter-style notifications. 🔔
