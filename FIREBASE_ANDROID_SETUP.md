# 🔥 Firebase Setup for React Native - Complete Guide

## ✅ What You've Done So Far

1. ✅ Created Android project in Firebase Console
2. ✅ Downloaded `google-services.json`
3. ✅ I've updated your Gradle files!

---

## 📁 Step 1: Place google-services.json File

The `google-services.json` file MUST be in the correct location:

```
mytweet/
└── android/
    └── app/
        └── google-services.json  👈 Place it HERE!
```

**Copy the file:**
```bash
# From wherever you downloaded it to the correct location:
Copy-Item "path\to\your\google-services.json" -Destination "C:\Users\muhanad\Desktop\tweet\mytweet\android\app\google-services.json"
```

Or manually:
1. Find your downloaded `google-services.json`
2. Copy it
3. Paste it in: `C:\Users\muhanad\Desktop\tweet\mytweet\android\app\`

---

## ✅ Step 2: Gradle Files Updated!

I've already updated both Gradle files for you:

### Project-level build.gradle ✅
Added Google Services plugin:
```gradle
classpath("com.google.gms:google-services:4.4.4")
```

### App-level build.gradle ✅
Added:
1. Google Services plugin
2. Firebase BoM (Bill of Materials)
3. Firebase Authentication
4. Firebase Analytics

---

## 📦 Step 3: Install React Native Firebase

```bash
cd C:\Users\muhanad\Desktop\tweet\mytweet

# Core Firebase package
npm install @react-native-firebase/app

# Firebase Authentication (for Google Sign-In)
npm install @react-native-firebase/auth

# Google Sign-In (for React Native)
npm install @react-native-google-signin/google-signin
```

---

## 🔧 Step 4: Configure Google Sign-In

### Get Web Client ID from Firebase:

1. Go to Firebase Console: https://console.firebase.google.com/project/media-e0b78/settings/general
2. Scroll down to "Your apps"
3. Click on your Android app
4. Find **"Web Client ID"** (looks like: `123456789-xxxxxxxx.apps.googleusercontent.com`)
5. Copy it!

### Update your React Native code:

Create `src/config/firebase.js`:

```javascript
import { GoogleSignin } from '@react-native-google-signin/google-signin'

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: 'YOUR_WEB_CLIENT_ID_HERE.apps.googleusercontent.com', // From Firebase Console
  offlineAccess: true,
})

export { GoogleSignin }
```

---

## 📱 Step 5: Implement Google Sign-In

### Example Login Screen:

```javascript
import React from 'react'
import { View, Button, Alert } from 'react-native'
import { GoogleSignin } from '@react-native-google-signin/google-signin'
import auth from '@react-native-firebase/auth'
import axios from 'axios'

const API_URL = 'http://localhost:5000' // or your Render URL

const LoginScreen = () => {
  
  const signInWithGoogle = async () => {
    try {
      // 1. Start Google Sign-In flow
      await GoogleSignin.hasPlayServices()
      const userInfo = await GoogleSignin.signIn()
      
      // 2. Get Firebase credential
      const { idToken } = userInfo
      const googleCredential = auth.GoogleAuthProvider.credential(idToken)
      
      // 3. Sign in to Firebase
      await auth().signInWithCredential(googleCredential)
      
      // 4. Get Firebase ID token
      const firebaseToken = await auth().currentUser.getIdToken()
      
      // 5. Send to your backend
      const response = await axios.post(`${API_URL}/api/auth/google`, {
        firebaseToken
      })
      
      // 6. Store JWT token from backend
      const { token, user } = response.data
      await AsyncStorage.setItem('token', token)
      await AsyncStorage.setItem('user', JSON.stringify(user))
      
      // 7. Navigate to Home
      // navigation.navigate('Home')
      
      Alert.alert('Success', 'Logged in successfully!')
      
    } catch (error) {
      console.error('Google Sign-In Error:', error)
      Alert.alert('Error', error.message)
    }
  }

  return (
    <View>
      <Button title="Sign in with Google" onPress={signInWithGoogle} />
    </View>
  )
}

export default LoginScreen
```

---

## 🔐 Step 6: Backend Configuration (Firebase Admin)

### For Backend to Verify Firebase Tokens:

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Add to your backend `.env`:

```env
FIREBASE_PROJECT_ID=media-e0b78
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@media-e0b78.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### Update Backend Controller:

The code is already in `controllers/auth.js`, just needs Firebase Admin SDK initialized:

Create `backend/config/firebase.js`:

```javascript
import admin from 'firebase-admin'

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  })
})

export { admin }
```

Then update `controllers/auth.js` to use it (I'll do this when you send the Admin SDK credentials).

---

## 🏃 Step 7: Build & Run

### Clean and rebuild Android:

```bash
cd C:\Users\muhanad\Desktop\tweet\mytweet\android
gradlew clean

cd ..
npm run android
```

If you get errors, try:
```bash
# Clear cache
cd android
gradlew clean
cd ..
npx react-native start --reset-cache

# In another terminal
npm run android
```

---

## 🍎 Step 8: iOS Setup (Later)

For iOS, you'll need:
1. Download `GoogleService-Info.plist` from Firebase Console
2. Add to Xcode project
3. Update `ios/Podfile`
4. Run `pod install`

We'll do this when you're ready to test on iOS!

---

## ✅ Checklist

### Android Setup:
- [ ] `google-services.json` placed in `android/app/` folder
- [x] Project-level `build.gradle` updated (I did this!)
- [x] App-level `build.gradle` updated (I did this!)
- [ ] Install npm packages: `@react-native-firebase/app`, `@react-native-firebase/auth`, `@react-native-google-signin/google-signin`
- [ ] Get Web Client ID from Firebase Console
- [ ] Configure GoogleSignin in your app
- [ ] Rebuild Android app

### Backend Setup:
- [ ] Download Firebase Admin SDK private key
- [ ] Add credentials to backend `.env`
- [ ] Initialize Firebase Admin in backend
- [ ] Test `/api/auth/google` endpoint

### Testing:
- [ ] Run Android app
- [ ] Click "Sign in with Google"
- [ ] Select Google account
- [ ] Verify token sent to backend
- [ ] Verify JWT token received
- [ ] User logged in successfully!

---

## 🐛 Troubleshooting

### Error: "google-services.json not found"
- Check file is in `android/app/` folder
- Make sure filename is exactly `google-services.json`

### Error: "Developer Error" on Google Sign-In
- Make sure you added SHA-1 fingerprint to Firebase Console
- Get SHA-1: `cd android && gradlew signingReport`
- Add to Firebase Console → Project Settings → Your App

### Error: "Web Client ID is required"
- Get Web Client ID from Firebase Console
- Add to `GoogleSignin.configure()`

### Build Errors
```bash
cd android
gradlew clean
cd ..
rm -rf node_modules
npm install
npm run android
```

---

## 📝 Next Steps

1. **Make sure `google-services.json` is in the right place**
2. **Install the npm packages**
3. **Get your Web Client ID**
4. **Run `npm run android`**
5. **Test Google Sign-In!**

Then we'll complete the backend integration!

---

## 🔥 Quick Commands Summary

```bash
# Install packages
npm install @react-native-firebase/app @react-native-firebase/auth @react-native-google-signin/google-signin

# Clean build
cd android && gradlew clean && cd ..

# Run app
npm run android

# Get SHA-1 for Firebase (if needed)
cd android && gradlew signingReport
```

---

Let me know when you've:
1. Placed `google-services.json` in the correct folder
2. Installed the packages
3. Ready to test!

Then I'll help you complete the implementation! 🚀
