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
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useUser } from '../../context/UserContext';
import { apiService } from '../../services/api';
import { ENDPOINTS, COLORS } from '../../utils/constants';

const SignupScreen = ({ navigation }: any) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date(2000, 0, 1)); // Default: Jan 1, 2000
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1); // Step 1: Name, Email, DOB | Step 2: Username, Password
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  
  const { login } = useUser();

  const handleDateChange = (event: any, date?: Date) => {
    if (event.type === 'set' && date) {
      setSelectedDate(date);
      // Format: MM/DD/YYYY
      const formatted = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
      setBirthDate(formatted);
    }
    setShowDatePicker(false);
  };

  const handleNext = () => {
    if (!name.trim()) {
      alert('Please enter your name');
      return;
    }
    if (!email.trim()) {
      alert('Please enter your email');
      return;
    }
    if (!birthDate.trim()) {
      alert('Please enter your date of birth');
      return;
    }
    setStep(2);
  };

  const handleSignup = async () => {
    if (!username.trim()) {
      alert('Please enter a username');
      return;
    }
    if (!password || password.length < 8) {
      alert('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.post(ENDPOINTS.SIGNUP, {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        username: username.toLowerCase().trim(),
        password,
        birthDate,
      });

      // Save token and user
      await login(response.token, response.user);
      
    } catch (error: any) {
      console.error('Signup error:', error);
      alert(error.message || 'Failed to create account');
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
            onPress={() => step === 1 ? navigation.goBack() : setStep(1)}
          >
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.logo}>𝕏</Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {step === 1 ? (
            <>
              <Text style={styles.title}>Create your account</Text>
              
              {/* Name Input with floating label */}
              <View style={styles.inputWrapper}>
                {name && (
                  <Text style={styles.floatingLabel}>Name</Text>
                )}
                <TextInput
                  style={[
                    styles.input,
                    focusedInput === 'name' && styles.inputFocused,
                    name && styles.inputFilled
                  ]}
                  placeholder="Name"
                  placeholderTextColor={COLORS.textGray}
                  value={name}
                  onChangeText={setName}
                  onFocus={() => setFocusedInput('name')}
                  onBlur={() => setFocusedInput(null)}
                  maxLength={50}
                />
                {name && (
                  <Text style={styles.charCount}>{name.length}/50</Text>
                )}
              </View>

              {/* Email Input with floating label */}
              <View style={styles.inputWrapper}>
                {email && (
                  <Text style={styles.floatingLabel}>Email</Text>
                )}
                <TextInput
                  style={[
                    styles.input,
                    focusedInput === 'email' && styles.inputFocused,
                    email && styles.inputFilled
                  ]}
                  placeholder="Email"
                  placeholderTextColor={COLORS.textGray}
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              {/* Date of Birth with floating label */}
              <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                <View style={styles.inputWrapper} pointerEvents="none">
                  {birthDate && (
                    <Text style={styles.floatingLabel}>Date of birth</Text>
                  )}
                  <TextInput
                    style={[
                      styles.input,
                      birthDate && styles.inputFilled
                    ]}
                    placeholder="Date of birth"
                    placeholderTextColor={COLORS.textGray}
                    value={birthDate}
                    editable={false}
                  />
                </View>
              </TouchableOpacity>
              
              {/* Date Picker Modal */}
              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  maximumDate={new Date()} // Can't select future dates
                  minimumDate={new Date(1900, 0, 1)} // Minimum: Jan 1, 1900
                />
              )}
              
              <Text style={styles.infoText}>
                This will not be shown publicly. Confirm your own age, even if this account is for a business, a pet, or something else.
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.title}>Choose a username and password</Text>
              
              {/* Username Input with floating label */}
              <View style={styles.inputWrapper}>
                {username && (
                  <Text style={styles.floatingLabel}>Username</Text>
                )}
                <TextInput
                  style={[
                    styles.input,
                    focusedInput === 'username' && styles.inputFocused,
                    username && styles.inputFilled
                  ]}
                  placeholder="Username (without @)"
                  placeholderTextColor={COLORS.textGray}
                  value={username}
                  onChangeText={setUsername}
                  onFocus={() => setFocusedInput('username')}
                  onBlur={() => setFocusedInput(null)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={15}
                />
                {username && (
                  <Text style={styles.charCount}>{username.length}/15</Text>
                )}
              </View>

              {/* Password Input with floating label */}
              <View style={styles.inputWrapper}>
                {password && (
                  <Text style={styles.floatingLabel}>Password</Text>
                )}
                <TextInput
                  style={[
                    styles.input,
                    focusedInput === 'password' && styles.inputFocused,
                    password && styles.inputFilled
                  ]}
                  placeholder="Password"
                  placeholderTextColor={COLORS.textGray}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                  secureTextEntry
                />
              </View>
              
              <Text style={styles.infoText}>
                Password must be at least 8 characters.
              </Text>
            </>
          )}
        </View>

        {/* Footer: Next button at bottom right */}
        <View style={styles.footer}>
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            style={[
              styles.nextButton,
              ((step === 1 && (!name || !email || !birthDate)) ||
               (step === 2 && (!username || password.length < 8)))
                ? styles.nextButtonDisabled
                : null
            ]}
            onPress={step === 1 ? handleNext : handleSignup}
            disabled={
              loading ||
              (step === 1 && (!name || !email || !birthDate)) ||
              (step === 2 && (!username || password.length < 8))
            }
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.nextButtonText}>
                {step === 1 ? 'Next' : 'Sign up'}
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
    paddingTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 30,
  },
  inputWrapper: {
    position: 'relative',
    marginBottom: 20,
  },
  floatingLabel: {
    position: 'absolute',
    top: -8,
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
  inputFocused: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  inputFilled: {
    paddingTop: 20,
  },
  charCount: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    color: COLORS.textGray,
    fontSize: 13,
  },
  infoText: {
    color: COLORS.textGray,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 10,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: 40,
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

export default SignupScreen;
