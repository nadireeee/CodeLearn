import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';
import { useI18n } from '../i18n/i18nProvider';
import { Button, Card, ProgressBar } from '../components';
import onboardingService, { OnboardingQuestion } from '../services/onboardingService';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingTop: 0,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
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
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 20,
  },
  progressContainer: {
    marginBottom: 24,
  },
  questionCard: {
    marginBottom: 20,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  selectedOption: {
    borderWidth: 3,
  },
  // Navigation butonları artık ScrollView dışında
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
});

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onComplete,
}) => {
  const { colors, typography } = useTheme();
  const { t } = useI18n();
  
  const [questions, setQuestions] = useState<OnboardingQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadQuestions();
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [currentQuestionIndex]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      const questionsData = await onboardingService.getOnboardingQuestions();
      setQuestions(questionsData);
    } catch (err) {
      console.error('Failed to load questions:', err);
      setError('Failed to load onboarding questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (questionKey: string, optionValue: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionKey]: optionValue,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // Save onboarding preferences
      await onboardingService.saveOnboardingPreferences(answers);
      
      // Mark onboarding as completed
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
      
      // Navigate to login
      onComplete();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setError('Tercihler kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setSaving(false);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? (currentQuestionIndex + 1) / questions.length : 0;
  const canProceed = currentQuestion && answers[currentQuestion?.key];

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          style={styles.container}
        >
          <View style={styles.loadingContainer}>
            <Text style={[typography.h2, { color: colors.textOnPrimary }]}>
              Loading questions...
            </Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          style={styles.container}
        >
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: colors.textOnPrimary }]}>
              {error}
            </Text>
            <Button
              title="Retry"
              onPress={loadQuestions}
              style={styles.retryButton}
            />
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        style={styles.container}
      >
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.content}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.header}>
                <View style={[styles.logoContainer, { backgroundColor: colors.surface }]}>
                  <Ionicons name="code-slash" size={40} color={colors.primary} />
                  <View style={[styles.plusPlus, { backgroundColor: colors.accent, borderColor: colors.surface }]}>
                    <Text style={[typography.caption, { color: colors.textOnPrimary, fontWeight: 'bold', fontSize: 10 }]}>
                      ++
                    </Text>
                  </View>
                </View>
                <Text style={[styles.title, { color: colors.textOnPrimary }]}>
                  Let's personalize your experience
                </Text>
                <Text style={[styles.subtitle, { color: colors.textOnPrimary }]}>
                  Answer a few questions to help us tailor your learning journey
                </Text>
              </View>

              <View style={styles.progressContainer}>
                <ProgressBar
                  progress={progress}
                  color={colors.accent}
                  backgroundColor={colors.surface}
                />
                <Text style={[typography.caption, { color: colors.textOnPrimary, textAlign: 'center', marginTop: 8 }]}>
                  {currentQuestionIndex + 1} of {questions.length}
                </Text>
              </View>

              {currentQuestion && (
                <Animated.View style={{ opacity: fadeAnim }}>
                  <Card style={styles.questionCard}>
                    <Text style={[styles.questionText, { color: colors.text }]}>
                      {currentQuestion.text}
                    </Text>
                    
                    <View style={styles.optionsContainer}>
                      {currentQuestion.options.map((option) => (
                        <TouchableOpacity
                          key={option.value}
                          style={[
                            styles.optionButton,
                            {
                              borderColor: colors.border,
                              backgroundColor: colors.surface,
                            },
                            answers[currentQuestion.key] === option.value && [
                              styles.selectedOption,
                              { borderColor: colors.accent, backgroundColor: colors.accent + '20' },
                            ],
                          ]}
                          onPress={() => handleOptionSelect(currentQuestion.key, option.value)}
                        >
                          <Text
                            style={[
                              styles.optionText,
                              {
                                color: answers[currentQuestion.key] === option.value
                                  ? colors.accent
                                  : colors.text,
                              },
                            ]}
                          >
                            {option.label}
                          </Text>
                          {answers[currentQuestion.key] === option.value && (
                            <Ionicons name="checkmark-circle" size={24} color={colors.accent} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </Card>
                </Animated.View>
              )}
            </ScrollView>

            {/* Navigation butonları artık ScrollView dışında, sabit pozisyonda */}
            <View style={[styles.navigationContainer, { borderTopColor: colors.border }]}>
              {currentQuestionIndex > 0 && (
                <TouchableOpacity
                  style={[
                    styles.backButton,
                    { borderColor: colors.border, backgroundColor: colors.surface },
                  ]}
                  onPress={handleBack}
                >
                  <Text style={[styles.backButtonText, { color: colors.text }]}>
                    Back
                  </Text>
                </TouchableOpacity>
              )}
              
              <View style={{ flex: 1 }} />
              
              <TouchableOpacity
                style={[
                  styles.nextButton,
                  {
                    backgroundColor: canProceed ? colors.accent : colors.border,
                  },
                ]}
                onPress={handleNext}
                disabled={!canProceed || saving}
              >
                <Text
                  style={[
                    styles.nextButtonText,
                    {
                      color: canProceed ? colors.textOnPrimary : colors.textSecondary,
                    },
                  ]}
                >
                  {saving ? 'Saving...' : currentQuestionIndex === questions.length - 1 ? 'Complete' : 'Next'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};