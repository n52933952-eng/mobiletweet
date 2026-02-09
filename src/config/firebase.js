import { GoogleSignin } from '@react-native-google-signin/google-signin'

/**
 * Firebase Configuration for React Native
 * 
 * Project: media-e0b78
 * Package: com.tweet
 */

// Configure Google Sign-In with Web Client ID from Firebase
GoogleSignin.configure({
  webClientId: '783773134798-9e2bi31ub8dhbbjebdrt5fh6u4deekd7.apps.googleusercontent.com',
  offlineAccess: true, // For getting refresh token
  forceCodeForRefreshToken: true, // iOS only
  
  // Force bottom sheet style (like Twitter)
  // This uses the new Google Sign-In UI
  scopes: ['email', 'profile'],
})

export { GoogleSignin }
