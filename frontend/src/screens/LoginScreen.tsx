import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../theme/ThemeProvider';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/i18nProvider';
import { Button, Input, Card } from '../components';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GOOGLE_CLIENT_ID } from '../services/constants';
import authService from '../services/authService';
import * as AuthSession from 'expo-auth-session';
import LoadingSpinner from '../components/LoadingSpinner';
import { Ionicons } from '@expo/vector-icons';

type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

interface LoginScreenProps {
  // Props removed - using React Navigation hooks instead
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...Platform.select({
      web: {
        boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
      },
      default: {
        shadowColor: 'rgba(0,0,0,0.5)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 10,
      },
    }),
    marginBottom: 24,
  },
  plusPlus: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
  formCard: {
    marginBottom: 24,
  },
  loginButton: {
    marginTop: 8,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
  },
  linkText: {
    fontWeight: '600',
  },
  orText: {
    textAlign: 'center',
    marginVertical: 16,
  },
  googleButton: {
    marginTop: 16,
  },
  signupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signupText: {
    fontSize: 14,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 16,
  },
  signupLink: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007bff',
    marginLeft: 4,
  },
  signupButton: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
    minHeight: 44,
  },
  signupButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

WebBrowser.maybeCompleteAuthSession();

export const LoginScreen: React.FC<LoginScreenProps> = () => {
  const { colors, typography } = useTheme();
  const { t } = useI18n();
  const { login, setAuthData } = useAuth();
  const navigation = useNavigation<LoginScreenNavigationProp>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [errorMessage, setErrorMessage] = useState('');

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
  });
  
  const headerAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(200, [
      Animated.spring(headerAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 40,
        friction: 7,
      }),
      Animated.spring(formAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 40,
        friction: 7,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    const redirectUri = request?.redirectUri;
    console.log('Yönlendirme Adresi (Redirect URI):', redirectUri);
    console.log('Kullanılan Google Client ID:', request?.clientId);
  }, [request]);

  useEffect(() => {
    if (response) {
      console.log('--- FRONTEND: Google response received ---', response);
      if (response.type === 'success') {
        const { id_token } = response.params;
        if (id_token) {
          setLoading(true);
          console.log('--- FRONTEND: Google ID Token received, sending to backend ---');
          authService.loginWithGoogle(id_token)
            .then(async (authData) => {
              console.log('--- FRONTEND: Backend Google login successful ---', authData);
              await setAuthData(authData);
              handleLoginSuccess();
            })
            .catch((err) => {
              console.error('--- FRONTEND: Backend Google login error ---', err);
              setErrorMessage(err.response?.data?.message || t('errors.googleLoginFailed'));
            })
            .finally(() => {
              setLoading(false);
            });
        }
      } else if (response.type === 'error') {
        console.error('--- FRONTEND: Google Auth Error ---', response.error);
        setErrorMessage(t('errors.googleAuthFailed'));
      }
    }
  }, [response]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setErrorMessage('');
    try {
      await login({ email, password });
      handleLoginSuccess();
    } catch (error: any) {
      console.error('Login failed:', error);
      setErrorMessage(error.response?.data?.message || t('errors.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    console.log('--- FRONTEND: Google Login button clicked ---');
    setErrorMessage('');
    try {
      await promptAsync();
    } catch (error) {
      console.error('Google login prompt error', error);
      setErrorMessage(t('errors.googleLoginStartFailed'));
    }
  };

  const handleNavigateToSignup = () => {
    console.log('Signup button clicked!'); // Debug için
    navigation.navigate('Signup');
  };

  const handleLoginSuccess = () => {
    // Login successful, navigation will be handled by AuthContext
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.accent]}
        style={styles.container}
      >
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.content}>
              <Animated.View
                style={[
                  styles.header,
                  {
                    opacity: headerAnim,
                    transform: [
                      {
                        translateY: headerAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-50, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <View style={[styles.logoContainer, { backgroundColor: colors.surface }]}>
                  <Ionicons name="code-slash" size={40} color={colors.primary} />
                  <View style={[styles.plusPlus, { backgroundColor: colors.accent, borderColor: colors.surface }]}>
                    <Text style={[typography.caption, { color: colors.textOnPrimary, fontWeight: 'bold', fontSize: 10 }]}>
                      ++
                    </Text>
                  </View>
                </View>
                <Text style={[styles.title, { color: colors.textOnPrimary }]}>
                  {t('login.title')}
                </Text>
                <Text style={[styles.subtitle, { color: colors.textOnPrimary, opacity: 0.8 }]}>
                  {t('welcomeSubtitle')}
                </Text>
              </Animated.View>

              <Animated.View
                style={{
                  opacity: formAnim,
                  transform: [
                    {
                      translateY: formAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [50, 0],
                      }),
                    },
                  ],
                }}
              >
                <Card style={styles.formCard}>
                  {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
                  <Input
                    label={t('email')}
                    placeholder="Enter your email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    error={errors.email}
                  />

                  <Input
                    label={t('password')}
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    error={errors.password}
                  />

                  <Button
                    title={loading ? 'Signing in...' : t('signIn')}
                    onPress={handleLogin}
                    disabled={loading}
                    style={styles.loginButton}
                  />
                </Card>

                <View style={styles.footer}>
                  <Text style={styles.orText}>{t('login.or')}</Text>
                  <Button
                    title={t('login.googleLoginButton')}
                    onPress={handleGoogleLogin}
                    variant="google"
                    icon="logo-google"
                    disabled={loading}
                  />
                </View>

                <View style={styles.footer}>
                  <Text style={[styles.footerText, { color: colors.textOnPrimary }]}>
                    {t('dontHaveAccount')}
                  </Text>
                  <TouchableOpacity 
                    onPress={handleNavigateToSignup}
                    style={[styles.signupButton, { backgroundColor: colors.accent }]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.signupButtonText, { color: colors.textOnPrimary }]}>
                      {t('signUp')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}; 