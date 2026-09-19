import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Dimensions,
  StatusBar,
  Platform,
  ActivityIndicator,
  Modal,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { useI18n } from '../i18n/i18nProvider';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { Button, Card, FuturisticNavbar } from '../components';
import { AiChatScreen } from './AiChatScreen';
import AiCodeBuilderScreen from './AiCodeBuilderScreen';
import CodeAnalysisScreen from './CodeAnalysisScreen';
import { UserStats, Quiz } from '../types/quiz';
import { quizApi, getAllQuizzes } from '../services/api';
import { SafeAreaView as SafeAreaViewRN } from 'react-native-safe-area-context';
import api from '../services/api';

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginVertical: 40,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    elevation: 10,
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  plusPlus: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardsContainer: {
    gap: 16,
    marginBottom: 30,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    elevation: 4,
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardGradient: {
    width: 60,
    height: 60,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  codePreviewContainer: {
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    elevation: 4,
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  codePreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  codePreviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  codeBlock: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 8,
    padding: 16,
    fontFamily: 'monospace',
  },
  codeText: {
    color: '#00FF00',
    fontSize: 14,
    lineHeight: 20,
  },
  statsContainer: {
    padding: 20,
    borderRadius: 16,
    elevation: 4,
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.5)',
  },
  progressIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    fontWeight: '500',
  },
  contentContainer: {
    paddingBottom: 100,
  },
  learningPathSection: {
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    elevation: 4,
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  learningPathHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  learningPathTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  pathItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  pathItemLast: {
    borderBottomWidth: 0,
  },
  pathIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pathContent: {
    flex: 1,
  },
  pathTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  pathDescription: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.6)',
  },
  pathStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '500',
  },
  // Welcome Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.9,
    maxWidth: 400,
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 0,
    elevation: 20,
    shadowColor: 'rgba(0,0,0,0.3)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 30,
  },
  welcomeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 22,
  },
  modalContent: {
    paddingHorizontal: 30,
    paddingBottom: 30,
  },
  welcomeMessage: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 26,
  },
  modalButtons: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#58CC02',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#58CC02',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E5E5',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  confetti: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  badgeShowcase: {
    padding: 20,
    borderRadius: 16,
    elevation: 4,
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  badgeShowcaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  badgeShowcaseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  viewAllText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#58CC02',
  },
  badgeShowcaseGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  badgeShowcaseItem: {
    flex: 1,
    alignItems: 'center',
  },
  emptyBadgesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyBadgesText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'rgba(0,0,0,0.5)',
    marginTop: 16,
  },
  badgeShowcaseName: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
});

export const HomeScreen: React.FC = () => {
  const { colors, typography } = useTheme();
  const { t, language } = useI18n();
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const [showAiChat, setShowAiChat] = useState(false);
  const [showAiCodeBuilder, setShowAiCodeBuilder] = useState(false);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [confettiAnimations] = useState(() => Array.from({ length: 20 }, () => new Animated.Value(0)));
  const [badges, setBadges] = useState<Badge[]>([]);

  // Helper functions - component içinde tanımla
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'kolay': return '#58CC02';
      case 'orta': return '#FF9600';
      case 'zor': return '#FF4B4B';
      default: return colors.accent;
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'kolay': return 'leaf';
      case 'orta': return 'flame';
      case 'zor': return 'diamond';
      default: return 'star';
    }
  };

  const animateConfetti = () => {
    const animations = confettiAnimations.map((anim, index) => {
      return Animated.sequence([
        Animated.delay(index * 50),
        Animated.timing(anim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.parallel(animations).start();
  };

  // Badge helper functions
  const getBadgeIcon = (iconName: string): keyof typeof Ionicons.glyphMap => {
    const iconMap: { [key: string]: keyof typeof Ionicons.glyphMap } = {
      'trophy': 'trophy',
      'star': 'star',
      'flame': 'flame',
      'flash': 'flash',
      'checkmark-circle': 'checkmark-circle',
      'bulb': 'bulb',
      'code': 'code',
      'diamond': 'diamond',
    };
    return iconMap[iconName] || 'star';
  };

  const getBadgeColor = (badgeColor: string) => {
    const colorMap: { [key: string]: string } = {
      '#FFD700': colors.accent,
      '#58CC02': colors.success,
      '#FF9600': colors.warning,
      '#FF4B4B': colors.error,
      '#8B5CF6': colors.primary,
      '#00D4FF': colors.info,
      '#FF6B6B': colors.error,
      '#4ECDC4': colors.success,
    };
    return colorMap[badgeColor] || colors.primary;
  };

  // BadgeShowcase component - ana bileşenin içinde tanımla
  const BadgeShowcase = () => {
    const recentBadges = badges.slice(0, 3);
    
    return (
      <View style={[styles.badgeShowcase, { backgroundColor: colors.surface }]}>
        <View style={styles.badgeShowcaseHeader}>
          <Text style={[styles.badgeShowcaseTitle, { color: colors.text }]}>
            {language === 'en' ? 'Recent Achievements' : 'Son Başarılar'}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('QuizStats' as never)}>
            <Text style={[styles.viewAllText, { color: colors.primary }]}>
              {language === 'en' ? 'View All' : 'Tümünü Gör'}
            </Text>
          </TouchableOpacity>
        </View>
        
        {recentBadges.length > 0 ? (
          <View style={styles.badgeShowcaseGrid}>
            {recentBadges.map((badge, index) => (
              <View key={index} style={styles.badgeShowcaseItem}>
                <Ionicons
                  name={getBadgeIcon(badge.icon)}
                  size={24}
                  color={getBadgeColor(badge.color)}
                />
                <Text style={[styles.badgeShowcaseName, { color: colors.text }]}>
                  {badge.name}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyBadgesContainer}>
            <Ionicons name="trophy-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyBadgesText, { color: colors.textSecondary }]}>
              {language === 'en' 
                ? 'Complete quizzes to earn badges!' 
                : 'Quiz çözerek rozet kazan!'
              }
            </Text>
          </View>
        )}
      </View>
    );
  };

  useEffect(() => {
    loadUserStats();
    loadBadges();
    async function fetchQuizzes() {
      try {
        setLoadingQuizzes(true);
        const response = await getAllQuizzes();
        setQuizzes(response.data);
      } catch (error) {
        setQuizzes([]);
      } finally {
        setLoadingQuizzes(false);
      }
    }
    fetchQuizzes();

    // Welcome modal disabled during portfolio screenshot capture
    // (Modal portals above all tabs and blocks navigation/chat).
    // const timer = setTimeout(() => {
    //   setShowWelcomeModal(true);
    //   animateConfetti();
    // }, 500);
    // return () => clearTimeout(timer);
  }, []);

  const loadUserStats = async () => {
    try {
      setLoading(true);
      const response = await quizApi.getUserStats();
      setUserStats(response.data);
    } catch (error) {
      console.error('Error loading user stats:', error);
      // Fallback: Default stats
      setUserStats({
        totalXp: 0,
        totalCrowns: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalLessonsCompleted: 0,
        totalSubjectsCompleted: 0,
        level: 1,
        levelProgress: 0,
        hearts: 5,
        gems: 0,
        dailyGoal: 50,
        dailyProgress: 0,
        lastLoginDate: new Date().toISOString().split('T')[0],
        totalStudyTime: 0,
        averageScore: 0,
        perfectLessons: 0,
        streakFreeze: 0,
        doubleXp: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Çıkış Yap',
      'Hesabınızdan çıkmak istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Çıkış Yap', style: 'destructive', onPress: logout }
      ]
    );
  };

  const handleRandomQuiz = () => {
    setShowWelcomeModal(false);
    navigation.navigate('RandomQuestionScreen' as never);
  };

  const handleContinueLearning = () => {
    setShowWelcomeModal(false);
  };

  // Badge'ları yükle
  const loadBadges = async () => {
    try {
      const response = await api.get('/badges/user');
      setBadges(response.data || []);
    } catch (error) {
      console.error('Error loading badges:', error);
      setBadges([]);
    }
  };

  if (showAiChat) {
    return (
      <AiChatScreen onClose={() => setShowAiChat(false)} />
    );
  }

  if (showAiCodeBuilder) {
    return (
      <AiCodeBuilderScreen onNavigateBack={() => setShowAiCodeBuilder(false)} />
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[typography.h3, { color: colors.text }]}>
              {t('homeScreen.welcome')}
              </Text>
            <Text style={[typography.body1, { color: colors.textSecondary }]}>
              {user?.firstName || 'User'}
            </Text>
          </View>
          
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={[styles.headerButton, { backgroundColor: colors.surface }]}
              onPress={() => navigation.navigate('CodeAnalysis' as never)}
            >
              <Ionicons name="analytics" size={20} color={colors.primary} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.headerButton, { backgroundColor: colors.surface }]}
              onPress={handleLogout}
            >
              <Ionicons name="log-out" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logo Section */}
        <View style={styles.logoSection}>
          <LinearGradient
            colors={colors.primaryGradient}
            style={styles.logoContainer}
          >
            <Text style={[typography.h1, { color: colors.textOnPrimary }]}>C</Text>
            <LinearGradient
              colors={colors.accentGradient}
              style={styles.plusPlus}
            >
              <Text style={[typography.caption, { color: colors.textOnPrimary }]}>++</Text>
            </LinearGradient>
          </LinearGradient>
        </View>

        {/* Quick Actions */}
        <View style={styles.cardsContainer}>
          <TouchableOpacity 
            style={[styles.card, { backgroundColor: colors.surface }]}
            onPress={() => navigation.navigate('AiChatScreen' as never)}
          >
            <LinearGradient
              colors={colors.primaryGradient}
              style={styles.cardGradient}
            >
              <Ionicons name="chatbubbles" size={24} color={colors.textOnPrimary} />
            </LinearGradient>
            <View style={styles.cardContent}>
              <Text style={[typography.h5, { color: colors.text }]}>
                {t('aiChat.title')}
              </Text>
              <Text style={[typography.body1, { color: colors.textSecondary }]}>
                {t('homeScreen.startCoding')}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.surface }]}
            onPress={() => navigation.navigate('RandomQuestionScreen' as never)}
          >
            <LinearGradient
              colors={colors.secondaryGradient}
              style={styles.cardGradient}
            >
              <Ionicons name="help-circle" size={24} color={colors.textOnPrimary} />
            </LinearGradient>
            <View style={styles.cardContent}>
              <Text style={[typography.h5, { color: colors.text }]}>
                {t('randomQuestion.title')}
              </Text>
              <Text style={[typography.body1, { color: colors.textSecondary }]}>
                {t('homeScreen.takeQuiz')}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.card, { backgroundColor: colors.surface }]}
            onPress={() => navigation.navigate('LessonsListScreen' as never)}
          >
            <LinearGradient
              colors={colors.accentGradient}
              style={styles.cardGradient}
            >
              <Ionicons name="book" size={24} color={colors.textOnPrimary} />
            </LinearGradient>
            <View style={styles.cardContent}>
              <Text style={[typography.h5, { color: colors.text }]}>
                {t('lessons')}
              </Text>
              <Text style={[typography.body1, { color: colors.textSecondary }]}>
                {t('homeScreen.continueLearning')}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Forum Card */}
          <TouchableOpacity 
            style={[styles.card, { backgroundColor: colors.surface }]}
            onPress={() => navigation.navigate('ForumListScreen' as never)}
          >
            <LinearGradient
              colors={['#FF6B6B', '#FF8E8E']}
              style={styles.cardGradient}
            >
              <Ionicons name="people" size={24} color={colors.textOnPrimary} />
            </LinearGradient>
            <View style={styles.cardContent}>
              <Text style={[typography.h5, { color: colors.text }]}>
                {t('forum.title')}
              </Text>
              <Text style={[typography.body1, { color: colors.textSecondary }]}>
                Toplulukla bağlantı kur
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* User Stats */}
        <View style={[styles.statsContainer, { backgroundColor: colors.surface }]}>
          <View style={styles.statsHeader}>
            <Ionicons name="stats-chart" size={24} color={colors.primary} />
            <Text style={[styles.statsTitle, { color: colors.text }]}>
              {t('homeScreen.userStats')}
            </Text>
          </View>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {userStats?.totalLessonsCompleted || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {t('homeScreen.completedLessons')}
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.secondary }]}>
                {userStats?.totalSubjectsCompleted || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {t('homeScreen.completedSubjects')}
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.accent }]}>
                {userStats?.averageScore || 0}%
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {t('homeScreen.averageScore')}
              </Text>
            </View>
          </View>
        </View>

        {/* Code Preview */}
        <View style={[styles.codePreviewContainer, { backgroundColor: colors.surface }]}>
          <View style={styles.codePreviewHeader}>
            <Ionicons name="code" size={24} color={colors.primary} />
            <Text style={[styles.codePreviewTitle, { color: colors.text }]}>
              {t('homeScreen.codePreview')}
            </Text>
          </View>
          
          <View style={[styles.codeBlock, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.codeText, { color: colors.primary }]}>
              {`#include <iostream>\n\nint main() {\n  std::cout << "Hello, World!" << std::endl;\n  return 0;\n}`}
            </Text>
          </View>
        </View>

        {/* Badge Showcase */}
        <BadgeShowcase />
      </ScrollView>

      {/* Welcome Modal */}
      <Modal
        visible={showWelcomeModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowWelcomeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Confetti Animation */}
            <View style={styles.confettiContainer}>
              {confettiAnimations.map((anim, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.confetti,
                    {
                      backgroundColor: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][index % 5],
                      left: Math.random() * width,
                      transform: [
                        {
                          translateY: anim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-50, height + 50],
                          }),
                        },
                        {
                          rotate: anim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '360deg'],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              ))}
            </View>

            <View style={styles.modalHeader}>
              <LinearGradient
                colors={['#58CC02', '#4CAF50']}
                style={styles.welcomeIcon}
              >
                <Ionicons name="rocket" size={40} color="white" />
              </LinearGradient>
              
              <Text style={styles.welcomeTitle}>
                Hoş Geldin! 🎉
              </Text>
              <Text style={styles.welcomeSubtitle}>
                {user?.firstName || 'Kullanıcı'}, C++ öğrenme yolculuğuna hazır mısın?
              </Text>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.welcomeMessage}>
                Bugün ne yapmak istiyorsun? Rastgele bir soru çözerek başlayabilir veya öğrenmeye devam edebilirsin!
              </Text>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleRandomQuiz}
                >
                  <Ionicons name="help-circle" size={20} color="white" />
                  <Text style={[styles.buttonText, { color: 'white' }]}>
                    Rastgele Soru Çöz! 🚀
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleContinueLearning}
                >
                  <Text style={styles.secondaryButtonText}>
                    Öğrenmeye Devam Et
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// Badge interface'ini ekle
interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  unlockedAt?: string;
  isNew?: boolean;
}

export default HomeScreen; 