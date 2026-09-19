import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';
import { useI18n } from '../i18n/i18nProvider';
import { quizApi, quizEngApi } from '../services/api';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Question {
  id: string;
  question: string;
  questionEn?: string;
  options: string[];
  optionsEn?: string[];
  correctAnswer: number;
  explanation: string;
  explanationEn?: string;
  points: number;
  timeLimit?: number;
}

interface Quiz {
  id: string;
  title: string;
  questions: Question[];
  timeLimit: number;
  maxHearts: number;
  xpReward: number;
}

interface ModernQuizScreenProps {
  navigation: any;
  route: any;
}

const ModernQuizScreen: React.FC<ModernQuizScreenProps> = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { language } = useI18n();
  const { quizId, skillName } = route.params;

  // State
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [hearts, setHearts] = useState(5);
  const [streak, setStreak] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [answeredCorrectly, setAnsweredCorrectly] = useState<boolean | null>(null);

  // Animations
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const heartAnim = useRef(new Animated.Value(1)).current;
  const streakAnim = useRef(new Animated.Value(1)).current;

  // API seçimi
  const api = language === 'en' ? quizEngApi : quizApi;

  useEffect(() => {
    loadQuiz();
  }, [quizId]);

  useEffect(() => {
    if (quiz && quizStarted && !showResult) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [quiz, quizStarted, showResult, currentQuestion]);

  useEffect(() => {
    if (quiz) {
      // Progress animation
      Animated.timing(progressAnim, {
        toValue: (currentQuestion + 1) / quiz.questions.length,
        duration: 500,
        useNativeDriver: false,
      }).start();
    }
  }, [currentQuestion, quiz]);

  const loadQuiz = async () => {
    try {
      setLoading(true);
      const response = await api.getQuizById(quizId);
      setQuiz(response.data);
      setHearts(response.data.maxHearts || 5);
      setTimeLeft(response.data.questions[0]?.timeLimit || response.data.timeLimit || 30);
    } catch (error) {
      console.error('Quiz yüklenirken hata:', error);
      Alert.alert('Hata', 'Quiz yüklenirken bir hata oluştu.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = async () => {
    try {
      await api.startQuiz(quizId);
      setQuizStarted(true);
      
      // Start animation
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (error) {
      console.error('Quiz başlatılırken hata:', error);
      Alert.alert('Hata', 'Quiz başlatılırken bir hata oluştu.');
    }
  };

  const handleAnswer = async (answerIndex: number) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(answerIndex);
    
    // Pulse animation
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      const currentQ = quiz!.questions[currentQuestion];
      const response = await api.submitAnswer(quizId, {
        questionId: currentQ.id,
        userAnswer: answerIndex,
        timeSpent: 30 - timeLeft,
      });
      
      setAnsweredCorrectly(response.data.isCorrect);
      
      if (response.data.isCorrect) {
        setScore(prev => prev + currentQ.points);
        setStreak(prev => prev + 1);
        
        // Streak animation
        Animated.sequence([
          Animated.timing(streakAnim, {
            toValue: 1.2,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(streakAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        setHearts(prev => prev - 1);
        setStreak(0);
        
        // Heart animation
        Animated.sequence([
          Animated.timing(heartAnim, {
            toValue: 0.8,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(heartAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start();
      }

      setTimeout(() => {
        if (currentQuestion < quiz!.questions.length - 1) {
          nextQuestion();
        } else {
          finishQuiz();
        }
      }, 1500);
    } catch (error) {
      console.error('Cevap gönderilirken hata:', error);
      Alert.alert('Hata', 'Cevap gönderilirken bir hata oluştu.');
    }
  };

  const nextQuestion = () => {
    Animated.timing(slideAnim, {
      toValue: -screenWidth,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setAnsweredCorrectly(null);
      
      const nextQ = quiz!.questions[currentQuestion + 1];
      setTimeLeft(nextQ?.timeLimit || quiz!.timeLimit || 30);
      
      slideAnim.setValue(screenWidth);
      
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleTimeout = () => {
    if (selectedAnswer !== null) return;
    
    setHearts(prev => prev - 1);
    setStreak(0);
    setAnsweredCorrectly(false);
    
    setTimeout(() => {
      if (currentQuestion < quiz!.questions.length - 1) {
        nextQuestion();
      } else {
        finishQuiz();
      }
    }, 1000);
  };

  const finishQuiz = async () => {
    try {
      const response = await api.completeQuiz(quizId);
      setShowResult(true);
      
      // Result animation
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Quiz tamamlanırken hata:', error);
      Alert.alert('Hata', 'Quiz tamamlanırken bir hata oluştu.');
    }
  };

  const getAnswerStyle = (index: number) => {
    if (selectedAnswer === null) {
      return [styles.answerButton, { backgroundColor: colors.surface }];
    }
    
    if (index === selectedAnswer) {
      if (answeredCorrectly === true) {
        return [styles.answerButton, { backgroundColor: colors.quiz.correct }];
      } else if (answeredCorrectly === false) {
        return [styles.answerButton, { backgroundColor: colors.quiz.incorrect }];
      }
    }
    
    if (answeredCorrectly === false && index === quiz!.questions[currentQuestion].correctAnswer) {
      return [styles.answerButton, { backgroundColor: colors.quiz.correct }];
    }
    
    return [styles.answerButton, { backgroundColor: colors.surfaceSecondary }];
  };

  const getAnswerTextStyle = (index: number) => {
    if (selectedAnswer === index && answeredCorrectly !== null) {
      return [styles.answerText, { color: colors.textOnPrimary }];
    }
    
    if (answeredCorrectly === false && index === quiz!.questions[currentQuestion].correctAnswer) {
      return [styles.answerText, { color: colors.textOnPrimary }];
    }
    
    return [styles.answerText, { color: colors.text }];
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            {language === 'en' ? 'Loading quiz...' : 'Quiz yükleniyor...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!quiz) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.text }]}>
            {language === 'en' ? 'Quiz not found' : 'Quiz bulunamadı'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (showResult) {
    const percentage = Math.round((score / quiz.questions.reduce((sum, q) => sum + q.points, 0)) * 100);
    
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={colors.primaryGradient}
          style={styles.resultContainer}
        >
          <Animated.View
            style={[
              styles.resultContent,
              { transform: [{ scale: scaleAnim }] },
            ]}
          >
            <Ionicons 
              name={percentage >= 70 ? "trophy" : "star"} 
              size={80} 
              color={colors.accent} 
            />
            <Text style={[styles.resultTitle, { color: colors.textOnPrimary }]}>
              {language === 'en' ? 'Quiz Complete!' : 'Quiz Tamamlandı!'}
            </Text>
            <Text style={[styles.resultScore, { color: colors.textOnPrimary }]}>
              {language === 'en' ? `Score: ${score}` : `Skor: ${score}`}
            </Text>
            <Text style={[styles.resultPercentage, { color: colors.textOnPrimary }]}>
              {percentage}%
            </Text>
            
            <View style={styles.resultStats}>
              <View style={styles.statItem}>
                <Ionicons name="checkmark-circle" size={24} color={colors.quiz.correct} />
                <Text style={[styles.statText, { color: colors.textOnPrimary }]}>
                  {quiz.questions.filter((_, i) => i < currentQuestion + 1).length}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="flame" size={24} color={colors.quiz.streak} />
                <Text style={[styles.statText, { color: colors.textOnPrimary }]}>
                  {streak}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="heart" size={24} color={colors.quiz.heart} />
                <Text style={[styles.statText, { color: colors.textOnPrimary }]}>
                  {hearts}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.continueButton, { backgroundColor: colors.accent }]}
              onPress={() => navigation.goBack()}
            >
              <Text style={[styles.continueButtonText, { color: colors.textOnAccent }]}>
                {language === 'en' ? 'Continue' : 'Devam Et'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (!quizStarted) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={colors.primaryGradient}
          style={styles.startContainer}
        >
          <View style={styles.startContent}>
            <Text style={[styles.startTitle, { color: colors.textOnPrimary }]}>
              {quiz.title}
            </Text>
            <Text style={[styles.startSubtitle, { color: colors.textOnPrimary }]}>
              {language === 'en' ? 'Ready to start?' : 'Başlamaya hazır mısın?'}
            </Text>
            
            <View style={styles.quizInfo}>
              <View style={styles.infoItem}>
                <Ionicons name="help-circle" size={20} color={colors.textOnPrimary} />
                <Text style={[styles.infoText, { color: colors.textOnPrimary }]}>
                  {quiz.questions.length} {language === 'en' ? 'questions' : 'soru'}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="time" size={20} color={colors.textOnPrimary} />
                <Text style={[styles.infoText, { color: colors.textOnPrimary }]}>
                  {quiz.timeLimit}s {language === 'en' ? 'per question' : 'soru başına'}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="heart" size={20} color={colors.textOnPrimary} />
                <Text style={[styles.infoText, { color: colors.textOnPrimary }]}>
                  {quiz.maxHearts} {language === 'en' ? 'hearts' : 'kalp'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.startButton, { backgroundColor: colors.accent }]}
              onPress={startQuiz}
            >
              <Text style={[styles.startButtonText, { color: colors.textOnAccent }]}>
                {language === 'en' ? 'Start Quiz' : 'Quiz\'i Başlat'}
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  const currentQ = quiz.questions[currentQuestion];
  const timePercentage = (timeLeft / (currentQ.timeLimit || quiz.timeLimit)) * 100;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      
      {/* Header */}
      <LinearGradient
        colors={colors.primaryGradient}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textOnPrimary} />
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <Text style={[styles.headerTitle, { color: colors.textOnPrimary }]}>
              {skillName}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textOnPrimary }]}>
              {currentQuestion + 1} / {quiz.questions.length}
            </Text>
          </View>
          
          <View style={styles.headerRight}>
            <View style={styles.heartsContainer}>
              {Array.from({ length: quiz.maxHearts }).map((_, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.heart,
                    { transform: [{ scale: heartAnim }] },
                  ]}
                >
                  <Ionicons
                    name="heart"
                    size={16}
                    color={index < hearts ? colors.quiz.heart : colors.borderSecondary}
                  />
                </Animated.View>
              ))}
            </View>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={[styles.progressContainer, { backgroundColor: colors.glass }]}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
                backgroundColor: colors.accent,
              },
            ]}
          />
        </View>
      </LinearGradient>

      {/* Question Content */}
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.questionContainer,
            { transform: [{ translateX: slideAnim }] },
          ]}
        >
          {/* Timer */}
          <View style={styles.timerContainer}>
            <View style={[styles.timerCircle, { borderColor: colors.quiz.timer }]}>
              <Text style={[styles.timerText, { color: colors.quiz.timer }]}>
                {timeLeft}
              </Text>
            </View>
            <View style={[styles.timerProgress, { backgroundColor: colors.borderSecondary }]}>
              <View
                style={[
                  styles.timerProgressFill,
                  {
                    width: `${timePercentage}%`,
                    backgroundColor: timePercentage > 30 ? colors.quiz.timer : colors.quiz.incorrect,
                  },
                ]}
              />
            </View>
          </View>

          {/* Question */}
          <View style={[styles.questionCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.questionText, { color: colors.text }]}>
              {language === 'en' ? currentQ.questionEn || currentQ.question : currentQ.question}
            </Text>
          </View>

          {/* Answers */}
          <View style={styles.answersContainer}>
            {currentQ.options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={getAnswerStyle(index)}
                onPress={() => handleAnswer(index)}
                disabled={selectedAnswer !== null}
              >
                <Text style={getAnswerTextStyle(index)}>
                  {language === 'en' ? currentQ.optionsEn?.[index] || option : option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Streak Indicator */}
          {streak > 0 && (
            <Animated.View
              style={[
                styles.streakContainer,
                {
                  backgroundColor: colors.quiz.streak,
                  transform: [{ scale: streakAnim }],
                },
              ]}
            >
              <Ionicons name="flame" size={20} color={colors.textOnPrimary} />
              <Text style={[styles.streakText, { color: colors.textOnPrimary }]}>
                {streak} {language === 'en' ? 'Streak' : 'Seri'}
              </Text>
            </Animated.View>
          )}
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  startContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  startTitle: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  startSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.9,
  },
  quizInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '600',
  },
  startButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
    opacity: 0.9,
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  heartsContainer: {
    flexDirection: 'row',
  },
  heart: {
    marginLeft: 4,
  },
  progressContainer: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  questionContainer: {
    flex: 1,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  timerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  timerText: {
    fontSize: 24,
    fontWeight: '800',
  },
  timerProgress: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  timerProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  questionCard: {
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    textAlign: 'center',
  },
  answersContainer: {
    gap: 12,
  },
  answerButton: {
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  answerText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 20,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginTop: 16,
    marginBottom: 8,
  },
  resultScore: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  resultPercentage: {
    fontSize: 48,
    fontWeight: '900',
    marginBottom: 24,
  },
  resultStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 32,
  },
  statItem: {
    alignItems: 'center',
  },
  statText: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  continueButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
});

export default ModernQuizScreen; 