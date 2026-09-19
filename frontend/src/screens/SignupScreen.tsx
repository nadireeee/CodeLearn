import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { useI18n } from '../i18n/i18nProvider';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Button, Input, Card } from '../components';
import authService from '../services/authService';
import LoadingSpinner from '../components/LoadingSpinner';

type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

type SignupScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Signup'>;

interface SignupScreenProps {
  // Props removed - using React Navigation hooks instead
}

export const SignupScreen: React.FC<SignupScreenProps> = () => {
  const { colors, typography } = useTheme();
  const { t } = useI18n();
  const { signup, isLoading } = useAuth();
  const navigation = useNavigation<SignupScreenNavigationProp>();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = async () => {
    console.log('🔐 Signup button clicked!');
    console.log('📝 Form data:', { firstName, lastName, email, password: '[HIDDEN]' });
    
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      console.log('❌ Validation failed: Empty fields');
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
      return;
    }

    if (password !== confirmPassword) {
      console.log('❌ Validation failed: Passwords do not match');
      Alert.alert('Hata', 'Şifreler eşleşmiyor');
      return;
    }

    if (password.length < 6) {
      console.log('❌ Validation failed: Password too short');
      Alert.alert('Hata', 'Şifre en az 6 karakter olmalıdır');
      return;
    }

    console.log('✅ Validation passed, calling signup...');
    
    try {
      console.log('🚀 Calling signup function...');
      await signup({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
      });
      console.log('✅ Signup successful!');
    } catch (error: any) {
      console.error('❌ Signup error:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      Alert.alert('Kayıt Hatası', error.response?.data?.message || t('signupError'));
    }
  };

  const handleNavigateToLogin = () => {
    navigation.navigate('Login');
  };

  const handleSignupSuccess = () => {
    // Signup successful, navigation will be handled by AuthContext
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.accent]}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={handleNavigateToLogin}
              style={[styles.backButton, { backgroundColor: colors.surface }]}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>

            <View style={[styles.logoContainer, { backgroundColor: colors.surface }]}>
              <Ionicons name="code-slash" size={32} color={colors.primary} />
              <View style={[styles.plusPlus, { backgroundColor: colors.accent }]}>
                <Text style={[typography.caption, { color: colors.textOnPrimary, fontWeight: 'bold', fontSize: 7 }]}>
                  ++
                </Text>
              </View>
            </View>

            <Text style={[typography.h2, { color: colors.textOnPrimary, textAlign: 'center', marginTop: 16 }]}>
              {t('signUp')}
            </Text>
          </View>

          {/* Signup Form */}
          <View style={[styles.formContainer, { backgroundColor: colors.surface }]}>
            {/* Name Inputs */}
            <View style={styles.nameRow}>
              <View style={[styles.nameInput, { marginRight: 8 }]}>
                <Text style={[typography.body2, { color: colors.textSecondary, marginBottom: 8 }]}>
                  {t('firstName')}
                </Text>
                <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}>
                  <Ionicons name="person-outline" size={20} color={colors.textTertiary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, typography.body1, { color: colors.text }]}
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="John"
                    placeholderTextColor={colors.textTertiary}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View style={[styles.nameInput, { marginLeft: 8 }]}>
                <Text style={[typography.body2, { color: colors.textSecondary, marginBottom: 8 }]}>
                  {t('lastName')}
                </Text>
                <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}>
                  <Ionicons name="person-outline" size={20} color={colors.textTertiary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, typography.body1, { color: colors.text }]}
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Doe"
                    placeholderTextColor={colors.textTertiary}
                    autoCapitalize="words"
                  />
                </View>
              </View>
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={[typography.body2, { color: colors.textSecondary, marginBottom: 8 }]}>
                {t('email')}
              </Text>
              <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}>
                <Ionicons name="mail-outline" size={20} color={colors.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, typography.body1, { color: colors.text }]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="example@email.com"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={[typography.body2, { color: colors.textSecondary, marginBottom: 8 }]}>
                {t('password')}
              </Text>
              <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, typography.body1, { color: colors.text }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textTertiary}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.passwordToggle}
                >
                  <Ionicons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color={colors.textTertiary} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Text style={[typography.body2, { color: colors.textSecondary, marginBottom: 8 }]}>
                {t('confirmPassword')}
              </Text>
              <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, typography.body1, { color: colors.text }]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textTertiary}
                  secureTextEntry={!showPassword}
                />
              </View>
            </View>

            {/* Signup Button */}
            <TouchableOpacity
              style={[styles.signupButton, { backgroundColor: colors.primary }]}
              onPress={handleSignup}
              disabled={isLoading}
            >
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                style={styles.buttonGradient}
              >
                {isLoading ? (
                  <Text style={[typography.button, { color: colors.textOnPrimary }]}>
                    Hesap oluşturuluyor...
                  </Text>
                ) : (
                  <Text style={[typography.button, { color: colors.textOnPrimary }]}>
                    {t('signUp')}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={[typography.body2, { color: colors.textSecondary }]}>
                {t('alreadyHaveAccount')}{' '}
              </Text>
              <TouchableOpacity onPress={handleNavigateToLogin}>
                <Text style={[typography.body2, { color: colors.primary, fontWeight: '600' }]}>
                  {t('signIn')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  plusPlus: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formContainer: {
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  nameRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  nameInput: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
  },
  passwordToggle: {
    padding: 4,
  },
  signupButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 20,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 