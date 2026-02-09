# 🔥 Firebase Setup - What We Need

## ✅ What We're Using from Firebase:

### 1. **Firebase Authentication** ✅
- **Purpose**: Google Sign-In only
- **Package**: `@react-native-firebase/auth`
- **Why**: Handles the OAuth flow with Google

### 2. **Firebase Admin SDK** (Backend Only) ✅
- **Purpose**: Verify tokens sent from mobile app
- **Package**: `firebase-admin` (already in backend)
- **Why**: Backend validates that the Google token is real

---

## ❌ What We DON'T Need:

- ❌ **Firestore** - We're using MongoDB
- ❌ **Firebase Storage** - We're using Cloudinary
- ❌ **Firebase Realtime Database** - We're using MongoDB + Socket.IO
- ❌ **Firebase Cloud Messaging** - Not needed for MVP (can add later for notifications)
- ❌ **Firebase Analytics** - Optional (we included it but not required)

---

## 📦 Updated Package List (Without Axios):

```bash
cd C:\Users\muhanad\Desktop\tweet\mytweet

npm install @react-native-firebase/app @react-native-firebase/auth @react-native-google-signin/google-signin @react-native-async-storage/async-storage
```

**That's it! Only 4 packages!**

---

## 🔄 Using Fetch Instead of Axios

### Example API Call with Fetch:

```javascript
// Login with backend
const loginWithGoogle = async (firebaseToken) => {
  try {
    const response = await fetch('https://your-backend.onrender.com/api/auth/google', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firebaseToken: firebaseToken
      })
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Login failed')
    }

    // data contains: { token, user }
    return data
    
  } catch (error) {
    console.error('Login error:', error)
    throw error
  }
}
```

### Protected API Call (with JWT token):

```javascript
const getProfile = async (token) => {
  const response = await fetch('https://your-backend.onrender.com/api/auth/me', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  })

  const data = await response.json()
  return data
}
```

---

## 🎯 Complete Authentication Flow (with Fetch):

```javascript
import auth from '@react-native-firebase/auth'
import { GoogleSignin } from '@react-native-google-signin/google-signin'
import AsyncStorage from '@react-native-async-storage/async-storage'

const signInWithGoogle = async () => {
  try {
    // 1. Google Sign-In
    await GoogleSignin.hasPlayServices()
    const userInfo = await GoogleSignin.signIn()
    
    // 2. Get Firebase credential
    const { idToken } = userInfo
    const googleCredential = auth.GoogleAuthProvider.credential(idToken)
    
    // 3. Sign in to Firebase
    await auth().signInWithCredential(googleCredential)
    
    // 4. Get Firebase token
    const firebaseToken = await auth().currentUser.getIdToken()
    
    // 5. Send to your backend (using FETCH)
    const response = await fetch('https://your-backend.onrender.com/api/auth/google', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ firebaseToken })
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Login failed')
    }
    
    // 6. Store JWT token from backend
    const { token, user } = data
    await AsyncStorage.setItem('token', token)
    await AsyncStorage.setItem('user', JSON.stringify(user))
    
    console.log('✅ Logged in successfully!')
    return { token, user }
    
  } catch (error) {
    console.error('❌ Google Sign-In Error:', error)
    throw error
  }
}
```

---

## 🔐 Backend Firebase Admin Setup

For the backend to verify Firebase tokens, we need Firebase Admin SDK credentials.

### Get Admin SDK Credentials:

1. **Firebase Console**: https://console.firebase.google.com/project/media-e0b78/settings/serviceaccounts/adminsdk
2. Click **"Generate new private key"**
3. Download JSON file
4. Add to backend `.env`:

```env
FIREBASE_PROJECT_ID=media-e0b78
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@media-e0b78.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

---

## 📋 Summary

### Mobile App Needs:
```json
{
  "@react-native-firebase/app": "Core Firebase",
  "@react-native-firebase/auth": "Google Sign-In",
  "@react-native-google-signin/google-signin": "Google OAuth",
  "@react-native-async-storage/async-storage": "Store tokens"
}
```

### Backend Needs:
- Firebase Admin SDK (already installed in your backend ✅)
- Admin SDK credentials (need to download)

### What Firebase Does:
- **Mobile**: Handles Google OAuth flow
- **Backend**: Verifies the Google token is real
- **That's it!** Everything else (users, tweets, messages) is in MongoDB

---

## ✅ Install Command (Updated - No Axios):

```bash
npm install @react-native-firebase/app @react-native-firebase/auth @react-native-google-signin/google-signin @react-native-async-storage/async-storage
```

---

## 🎯 Next Steps:

1. **Install packages** (command above)
2. **Download Firebase Admin SDK** for backend
3. **Build & test** Google Sign-In
4. **Create Login UI** with fetch API calls

---

**Run the install command now!** And I'll help you set up the backend Firebase Admin SDK next! 🚀
