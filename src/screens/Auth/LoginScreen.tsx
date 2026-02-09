import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { useUser } from '../../context/UserContext';
import { apiService } from '../../services/api';
import { ENDPOINTS, COLORS, TWITTER_STYLES } from '../../utils/constants';

const LoginScreen = ({ navigation }: any) => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<'email' | 'password'>('email');
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  
  const { login } = useUser();

  const handleNext = () => {
    if (!emailOrUsername.trim()) {
      alert('Please enter your email, phone, or username');
      return;
    }
    setStep('password');
  };

  const handleLogin = async () => {
    if (!password) {
      alert('Please enter your password');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.post(ENDPOINTS.LOGIN, {
        emailOrUsername: emailOrUsername.toLowerCase().trim(),
        password,
      });

      // Save token and user
      await login(response.token, response.user);
      
    } catch (error: any) {
      console.error('Login error:', error);
      alert(error.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.logo}>𝕏</Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {step === 'email' ? (
            <>
              <Text style={styles.title}>To get started, first enter your phone, email, or @username</Text>
              
              <TextInput
                style={[
                  styles.input,
                  focusedInput === 'email' && styles.inputFocused
                ]}
                placeholder="Phone, email, or username"
                placeholderTextColor={COLORS.textGray}
                value={emailOrUsername}
                onChangeText={setEmailOrUsername}
                onFocus={() => setFocusedInput('email')}
                onBlur={() => setFocusedInput(null)}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
              />
            </>
          ) : (
            <>
              <Text style={styles.title}>Enter your password</Text>
              
              {/* Show username (disabled) */}
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={emailOrUsername}
                editable={false}
              />
              
              <View style={styles.inputContainer}>
                {/* Password Label */}
                {password && (
                  <Text style={styles.inputLabel}>Password</Text>
                )}
                
                <TextInput
                  style={[
                    styles.input, 
                    { paddingRight: 80, marginTop: 15 },
                    focusedInput === 'password' && styles.inputFocused,
                    password && styles.inputFilled
                  ]}
                  placeholder="Password"
                  placeholderTextColor={COLORS.textGray}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                  secureTextEntry={!showPassword}
                  autoFocus
                />
                
                {/* Eye Icon */}
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.eyeText}>{showPassword ? '👁️' : '👁️'}</Text>
                </TouchableOpacity>
                
                {/* Checkmark when password is entered */}
                {password && (
                  <View style={styles.checkmarkButton}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </View>
            </>
          )}
        </View>

        {/* Bottom: Forgot password + Next button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.forgotButton}
            onPress={() => {/* TODO: Forgot password */}}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.nextButton,
              (!emailOrUsername && step === 'email') || (!password && step === 'password') 
                ? styles.nextButtonDisabled 
                : null
            ]}
            onPress={step === 'email' ? handleNext : handleLogin}
            disabled={
              loading || 
              (!emailOrUsername && step === 'email') || 
              (!password && step === 'password')
            }
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.nextButtonText}>
                {step === 'email' ? 'Next' : 'Log in'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 20,
    zIndex: 10,
  },
  backText: {
    fontSize: 20,
    color: COLORS.text,
    fontWeight: '400',
  },
  logo: {
    fontSize: 30,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 30,
    lineHeight: 32,
  },
  inputContainer: {
    position: 'relative',
  },
  inputLabel: {
    position: 'absolute',
    top: 8,
    left: 12,
    color: COLORS.primary,
    fontSize: 12,
    zIndex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 4,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
    borderRadius: 4,
    padding: 15,
    color: COLORS.text,
    fontSize: 17,
  },
  inputDisabled: {
    backgroundColor: COLORS.backgroundLight,
    color: COLORS.text,
    borderColor: COLORS.border,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  inputFilled: {
    backgroundColor: '#FFFBEA', // Light yellow background
    borderColor: COLORS.primary,
    borderWidth: 2,
    paddingTop: 20, // Extra padding for label
  },
  eyeButton: {
    position: 'absolute',
    right: 50,
    top: 30,
  },
  eyeText: {
    fontSize: 20,
  },
  checkmarkButton: {
    position: 'absolute',
    right: 15,
    top: 30,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#00BA7C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    paddingBottom: 40,
  },
  forgotButton: {
    padding: 5,
  },
  forgotText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '400',
  },
  nextButton: {
    backgroundColor: COLORS.buttonWhite,
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 30,
    minWidth: 80,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#2F3336',
    opacity: 0.5,
  },
  nextButtonText: {
    color: COLORS.black,
    fontSize: 17,
    fontWeight: 'bold',
  },
});

export default LoginScreen;
