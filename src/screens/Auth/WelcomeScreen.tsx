import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import { useUser } from '../../context/UserContext';
import { apiService } from '../../services/api';
import { ENDPOINTS, COLORS } from '../../utils/constants';

// Google Icon Component (Using PNG image)
const GoogleIcon = () => (
  <Image 
    source={require('../../assets/google-icon.png')} 
    style={styles.googleIcon}
    resizeMode="contain"
  />
);

const WelcomeScreen = ({ navigation }: any) => {
  const { login } = useUser();
  const [loading, setLoading] = useState(false);

  // Auto-open Google Sign-In modal EVERY TIME this screen is focused
  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => {
        handleGoogleSignIn();
      }, 500); // Wait 500ms for screen to render

      return () => clearTimeout(timer);
    }, [])
  );

  const handleGoogleSignIn = async () => {
    try {
      console.log('🔵 Starting Google Sign-In...');
      
      // 1. Check Play Services
      await GoogleSignin.hasPlayServices();
      console.log('✅ Play Services available');
      
      // 2. Sign in with Google (modal opens automatically)
      const result = await GoogleSignin.signIn();
      
      console.log('Google Sign-In result:', result);
      
      // 3. Check if user cancelled
      if (result.type === 'cancelled' || !result.data) {
        console.log('User dismissed Google Sign-In');
        return; // Exit silently
      }
      
      // 4. Get idToken from the result
      const idToken = result.data.idToken;
      
      if (!idToken) {
        throw new Error('No idToken received from Google Sign-In');
      }
      
      console.log('✅ Got idToken:', idToken.substring(0, 20) + '...');
      
      // 5. Create Firebase credential
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      
      // 6. Sign in to Firebase
      await auth().signInWithCredential(googleCredential);
      console.log('✅ Signed in to Firebase');
      
      // 7. Get Firebase user info
      const firebaseUser = auth().currentUser;
      const firebaseToken = await firebaseUser?.getIdToken();
      
      if (!firebaseToken || !firebaseUser) {
        throw new Error('Failed to get Firebase token');
      }
      
      console.log('✅ Got Firebase user:', firebaseUser.email);
      
      // 8. Send to backend with user info
      console.log('🔵 Sending to backend...');
      const response = await apiService.post(ENDPOINTS.GOOGLE_SIGNIN, {
        firebaseToken,
        email: firebaseUser.email,
        name: firebaseUser.displayName || result.data.user?.name,
        googleId: firebaseUser.uid,
        profilePic: firebaseUser.photoURL || result.data.user?.photo
      });
      
      console.log('✅ Backend response:', response);
      
      // 9. Save token and user
      console.log('🔵 Logging in user...');
      await login(response.token, response.user);
      
      console.log('✅ User logged in! Should navigate now...');
      
    } catch (error: any) {
      // Only log real errors, not user cancellations
      if (error.code !== 'SIGN_IN_CANCELLED') {
        console.error('❌ Google Sign-In error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with X logo */}
      <View style={styles.header}>
        <Text style={styles.logo}>𝕏</Text>
      </View>

      {/* Main content */}
      <View style={styles.content}>
        <Text style={styles.title}>See what's happening in the world right now.</Text>
      </View>

      {/* Bottom buttons */}
      <View style={styles.footer}>
        {/* Google Sign-In Button */}
        <TouchableOpacity 
          style={styles.googleButton}
          onPress={handleGoogleSignIn}
        >
          <GoogleIcon />
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Create Account Button */}
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => navigation.navigate('Signup')}
        >
          <Text style={styles.createButtonText}>Create account</Text>
        </TouchableOpacity>

        {/* Terms */}
        <Text style={styles.termsText}>
          By signing up, you agree to our{' '}
          <Text style={styles.termsLink}>Terms</Text>,{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>, and{' '}
          <Text style={styles.termsLink}>Cookie Use</Text>.
        </Text>

        {/* Login Link */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Have an account already? </Text>
          <TouchableOpacity onPress={() => {
            setLoading(true);
            setTimeout(() => {
              setLoading(false);
              navigation.navigate('Login');
            }, 1500); // Show loading for 1.5 seconds
          }}>
            <Text style={styles.loginLink}>Log in</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingLogo}>𝕏</Text>
          <ActivityIndicator size="small" color={COLORS.text} style={styles.loadingSpinner} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 10,
  },
  logo: {
    fontSize: 40,
    color: COLORS.text,
    fontWeight: 'bold',
    letterSpacing: -2,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  footer: {
    paddingHorizontal: 30,
    paddingBottom: 40,
  },
  googleButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#CFD9DE',
  },
  googleIcon: {
    width: 36,
    height: 36,
    marginRight: 6,
  },
  googleButtonText: {
    color: '#1D1D1F',
    fontSize: 15,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#CFD9DE',
  },
  dividerText: {
    color: COLORS.text,
    paddingHorizontal: 15,
    fontSize: 15,
  },
  createButton: {
    backgroundColor: COLORS.buttonBlack,
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  createButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: 'bold',
  },
  termsText: {
    color: COLORS.textGray,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 30,
  },
  termsLink: {
    color: COLORS.primary,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginText: {
    color: COLORS.text,
    fontSize: 15,
  },
  loginLink: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: 'bold',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingLogo: {
    fontSize: 48,
    color: COLORS.text,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  loadingSpinner: {
    marginTop: 10,
  },
  loadingText: {
    color: COLORS.text,
    fontSize: 17,
    marginTop: 20,
    fontWeight: '600',
  },
});

export default WelcomeScreen;
