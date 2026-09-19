import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  Image,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { useAuth } from '../context/AuthContext';
import { lessonsApi } from '../services/api';
import CodePreview from '../components/CodePreview';
import FuturisticNavbar from '../components/FuturisticNavbar';
import BadgeNotification from '../components/BadgeNotification';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  Lesson,
  LessonContent,
  Language,
  Locale,
} from '../types/lessons';

interface Badge {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  icon: string;
  color: string;
  rarity: string;
}

interface LessonScreenProps {
  route: {
    params: {
      lessonId: string;
      language?: Language;
      locale?: Locale;
    };
  };
  navigation: any;
}

const { width } = Dimensions.get('window');

const LessonScreen: React.FC<LessonScreenProps> = ({ route, navigation }) => {
  const { lessonId, language = 'cpp', locale = 'tr' } = route.params;
  const { colors } = useTheme();
  const { user, isAuthenticated } = useAuth();
  
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQuizAnswers, setShowQuizAnswers] = useState<{ [key: number]: boolean }>({});
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: string }>({});
  const [canAccess, setCanAccess] = useState(false);
  const [earnedBadge, setEarnedBadge] = useState<Badge | null>(null);
  const [showBadgeNotification, setShowBadgeNotification] = useState(false);

  useEffect(() => {
    loadLesson();
  }, [lessonId, language, locale]);

  const loadLesson = async () => {
    try {
      setLoading(true);
      
      console.log('Loading lesson:', { lessonId, language, locale });
      
      // Check if user can access this lesson
      try {
        const accessResponse = await lessonsApi.canAccessLesson(lessonId, language, locale);
        console.log('Access check response:', accessResponse);
        setCanAccess(accessResponse.data?.canAccess ?? true);
        
        if (!accessResponse.data?.canAccess) {
          const message = locale === 'tr' 
            ? 'Bu derse erişmek için önceki dersleri tamamlamanız gerekiyor.'
            : 'You need to complete previous lessons to access this lesson.';
          Alert.alert(
            locale === 'tr' ? 'Erişim Engellendi' : 'Access Denied', 
            message
          );
          navigation.goBack();
          return;
        }
      } catch (accessError) {
        console.log('Access check failed, proceeding anyway:', accessError);
        setCanAccess(true);
      }
      
      // Load lesson
      const response = await lessonsApi.getLesson(lessonId, language, locale);
      console.log('Lesson response:', response);
      
      if (response.data && response.data.lesson) {
        setLesson(response.data.lesson);
      } else if (response.data && response.data.entityType === 'lesson') {
        setLesson(response.data);
      } else {
        console.error('Invalid lesson response:', response);
        const message = locale === 'tr' 
          ? 'Ders verisi alınamadı.'
          : 'Could not load lesson data.';
        Alert.alert(locale === 'tr' ? 'Hata' : 'Error', message);
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading lesson:', error);
      const message = locale === 'tr' 
        ? 'Ders yüklenirken bir hata oluştu.'
        : 'An error occurred while loading the lesson.';
      Alert.alert(locale === 'tr' ? 'Hata' : 'Error', message);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteLesson = async () => {
    if (!isAuthenticated || !user) {
      const title = locale === 'tr' ? 'Giriş Gerekli' : 'Login Required';
      const message = locale === 'tr' 
        ? 'Dersi tamamlamak için lütfen giriş yapın.'
        : 'Please login to complete the lesson.';
      const cancelText = locale === 'tr' ? 'İptal' : 'Cancel';
      const loginText = locale === 'tr' ? 'Giriş Yap' : 'Login';
      
      Alert.alert(
        title, 
        message,
        [
          { text: cancelText, style: 'cancel' },
          { text: loginText, onPress: () => navigation.navigate('LoginScreen') }
        ]
      );
      return;
    }

    if (!lesson) {
      const message = locale === 'tr' 
        ? 'Ders bulunamadı.'
        : 'Lesson not found.';
      Alert.alert(locale === 'tr' ? 'Hata' : 'Error', message);
      return;
    }

    try {
      // Use lesson._id as the primary ID
      const lessonId = lesson._id;
      console.log('Ders tamamlanıyor...', { 
        lessonId, 
        lessonIdType: typeof lessonId,
        lesson: { _id: lesson._id, title: lesson.title },
        language, 
        locale 
      });
      
      const response = await lessonsApi.markLessonCompleted(lessonId, language, locale);
      
      // Check if any badges were earned
      if (response.data?.earnedBadges && response.data.earnedBadges.length > 0) {
        const newBadge = response.data.earnedBadges[0]; // Show the first earned badge
        setEarnedBadge(newBadge);
        setShowBadgeNotification(true);
      } else {
        const title = locale === 'tr' ? 'Tebrikler!' : 'Congratulations!';
        const message = locale === 'tr' 
          ? 'Dersi tamamladınız!'
          : 'You completed the lesson!';
        Alert.alert(title, message);
      }
    } catch (error: any) {
      console.error('Ders tamamlama hatası:', error);
      console.error('Error details:', {
        response: error.response?.data,
        status: error.response?.status,
        message: error.message
      });
      
      let errorMessage = locale === 'tr' 
        ? 'Ders tamamlanırken bir hata oluştu.'
        : 'An error occurred while completing the lesson.';
      
      // Specific error messages
      if (error.response?.status === 404) {
        errorMessage = locale === 'tr' 
          ? 'Ders bulunamadı. Lütfen tekrar deneyin.'
          : 'Lesson not found. Please try again.';
      } else if (error.response?.status === 400) {
        errorMessage = locale === 'tr' 
          ? 'Bu ders zaten tamamlanmış.'
          : 'This lesson is already completed.';
      } else if (error.response?.status === 401) {
        errorMessage = locale === 'tr' 
          ? 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.'
          : 'Session expired. Please login again.';
      }
      
      Alert.alert(locale === 'tr' ? 'Hata' : 'Error', errorMessage);
    }
  };

  const getLocalizedText = (trText: string, enText: string) => {
    return locale === 'tr' ? trText : enText;
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <FuturisticNavbar title={getLocalizedText('Ders', 'Lesson')} />
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            {getLocalizedText('Ders yükleniyor...', 'Loading lesson...')}
          </Text>
        </View>
      </View>
    );
  }

  if (!lesson) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <FuturisticNavbar title={getLocalizedText('Ders', 'Lesson')} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>
            {getLocalizedText('Ders bulunamadı', 'Lesson not found')}
          </Text>
        </View>
      </View>
    );
  }

  const renderContent = (content: LessonContent, index: number) => {
    switch (content.type) {
      case 'text':
        return (
          <Text key={index} style={[styles.text, { color: colors.text }]}>
            {content.value}
          </Text>
        );

      case 'code':
        return (
          <View key={index} style={styles.codeContainer}>
            <CodePreview 
              code={content.value || ''} 
              language={content.language || 'cpp'}
            />
          </View>
        );

      case 'quiz':
        const isAnswerShown = showQuizAnswers[index];
        const selectedAnswer = selectedAnswers[index];
        const isCorrect = selectedAnswer === content.answer;

        return (
          <View key={index} style={[styles.quizContainer, { backgroundColor: colors.surfaceSecondary }]}>
            <View style={styles.quizHeader}>
              <Ionicons name="help-circle" size={24} color={colors.primary} />
              <Text style={[styles.quizTitle, { color: colors.text }]}>
                {getLocalizedText('Quiz', 'Quiz')}
              </Text>
            </View>
            
            <Text style={[styles.quizQuestion, { color: colors.text }]}>
              {content.question}
            </Text>

            {content.value && (
              <View style={[styles.codeContainer, { marginVertical: 12 }]}>
                <CodePreview 
                  code={content.value} 
                  language="cpp"
                />
              </View>
            )}

            {content.options && (
              <View style={styles.optionsContainer}>
                {content.options.map((option, optionIndex) => (
                  <TouchableOpacity
                    key={optionIndex}
                    style={[
                      styles.optionButton,
                      { 
                        backgroundColor: selectedAnswer === option 
                          ? (isCorrect ? colors.success : colors.error)
                          : colors.surface,
                        borderColor: colors.border
                      }
                    ]}
                    onPress={() => {
                      setSelectedAnswers(prev => ({ ...prev, [index]: option }));
                    }}
                    disabled={isAnswerShown}
                  >
                    <Text style={[
                      styles.optionText,
                      { 
                        color: selectedAnswer === option 
                          ? colors.textOnPrimary 
                          : colors.text 
                      }
                    ]}>
                      {String.fromCharCode(65 + optionIndex)}. {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={styles.quizActions}>
              {!isAnswerShown ? (
                <TouchableOpacity
                  style={[styles.quizButton, { backgroundColor: colors.primary }]}
                  onPress={() => setShowQuizAnswers(prev => ({ ...prev, [index]: true }))}
                >
                  <Text style={[styles.quizButtonText, { color: colors.textOnPrimary }]}>
                    {getLocalizedText('Cevabı Göster', 'Show Answer')}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.answerContainer}>
                  <Text style={[styles.answerLabel, { color: colors.textSecondary }]}>
                    {getLocalizedText('Doğru Cevap:', 'Correct Answer:')}
                  </Text>
                  <Text style={[styles.answerText, { color: colors.success }]}>
                    {content.answer}
                  </Text>
                  {selectedAnswer && (
                    <Text style={[
                      styles.selectedAnswer,
                      { color: isCorrect ? colors.success : colors.error }
                    ]}>
                      {getLocalizedText('Senin cevabın:', 'Your answer:')} {selectedAnswer} {isCorrect ? '✓' : '✗'}
                    </Text>
                  )}
                </View>
              )}
            </View>
          </View>
        );

      case 'warning':
        return (
          <View key={index} style={[styles.warningContainer, { backgroundColor: colors.warning + '20' }]}>
            <View style={styles.warningHeader}>
              <Ionicons name="warning" size={24} color={colors.warning} />
              <Text style={[styles.warningTitle, { color: colors.warning }]}>
                {content.title || getLocalizedText('Uyarı', 'Warning')}
              </Text>
            </View>
            <Text style={[styles.warningText, { color: colors.text }]}>
              {content.value}
            </Text>
          </View>
        );

      case 'note':
        return (
          <View key={index} style={[styles.noteContainer, { backgroundColor: colors.info + '20' }]}>
            <View style={styles.noteHeader}>
              <Ionicons name="information-circle" size={24} color={colors.info} />
              <Text style={[styles.noteTitle, { color: colors.info }]}>
                {content.title || getLocalizedText('Not', 'Note')}
              </Text>
            </View>
            <Text style={[styles.noteText, { color: colors.text }]}>
              {content.value}
            </Text>
          </View>
        );

      case 'image':
        return (
          <View key={index} style={styles.imageContainer}>
            <Image 
              source={{ uri: content.url }} 
              style={styles.image}
              resizeMode="contain"
            />
            {content.caption && (
              <Text style={[styles.imageCaption, { color: colors.textSecondary }]}>
                {content.caption}
              </Text>
            )}
          </View>
        );

      case 'video':
        return (
          <View key={index} style={styles.videoContainer}>
            {content.url && (
              <WebView
                source={{ uri: content.url }}
                style={{ width: width - 32, height: 220, borderRadius: 12, overflow: 'hidden' }}
                allowsFullscreenVideo
                javaScriptEnabled
                domStorageEnabled
              />
            )}
            {content.caption && (
              <Text style={[styles.imageCaption, { color: colors.textSecondary }]}> 
                {content.caption}
              </Text>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return colors.success;
      case 'intermediate': return colors.warning;
      case 'advanced': return colors.error;
      default: return colors.textSecondary;
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return getLocalizedText('Başlangıç', 'Beginner');
      case 'intermediate': return getLocalizedText('Orta', 'Intermediate');
      case 'advanced': return getLocalizedText('İleri', 'Advanced');
      default: return difficulty;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FuturisticNavbar title={lesson.title} />
      
      {/* Badge Notification */}
      <BadgeNotification
        badge={earnedBadge}
        visible={showBadgeNotification}
        onClose={() => {
          setShowBadgeNotification(false);
          setEarnedBadge(null);
        }}
        locale={locale}
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Lesson Header */}
        <View style={[styles.lessonHeader, { backgroundColor: colors.surface }]}>
          <View style={styles.lessonInfo}>
            <Text style={[styles.lessonTitle, { color: colors.text }]}>
              {lesson.title}
            </Text>
            <Text style={[styles.lessonId, { color: colors.textSecondary }]}>
              {getLocalizedText('Ders', 'Lesson')} {lesson.order}
            </Text>
          </View>
          
          <View style={styles.lessonMeta}>
            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(lesson.difficulty) + '20' }]}>
              <Text style={[styles.difficultyText, { color: getDifficultyColor(lesson.difficulty) }]}>
                {getDifficultyText(lesson.difficulty)}
              </Text>
            </View>
            
            <View style={styles.timeBadge}>
              <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                {lesson.estimatedTime} {getLocalizedText('dk', 'min')}
              </Text>
            </View>
          </View>
        </View>

        {/* Lesson Content */}
        <View style={styles.lessonContent}>
          {lesson.content && Array.isArray(lesson.content) ? (
            lesson.content.map((content, index) => renderContent(content, index))
          ) : (
            <Text style={[styles.text, { color: colors.textSecondary }]}>
              {getLocalizedText('Bu ders için henüz içerik bulunmuyor.', 'No content available for this lesson yet.')}
            </Text>
          )}
        </View>

        {/* Navigation */}
        <View style={styles.navigation}>
          <TouchableOpacity
            style={[styles.navButton, { backgroundColor: colors.surface }]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
            <Text style={[styles.navButtonText, { color: colors.text }]}>
              {getLocalizedText('Geri', 'Back')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.navButton, { backgroundColor: colors.primary }]}
            onPress={handleCompleteLesson}
          >
            <Ionicons name="checkmark" size={20} color="white" />
            <Text style={[styles.navButtonText, { color: 'white' }]}>
              {getLocalizedText('Tamamla', 'Complete')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
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
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 32,
  },
  lessonHeader: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  lessonInfo: {
    marginBottom: 16,
  },
  lessonTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  lessonId: {
    fontSize: 16,
    fontWeight: '500',
  },
  lessonMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 14,
    fontWeight: '600',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  lessonContent: {
    paddingHorizontal: 16,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  codeContainer: {
    marginVertical: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  quizContainer: {
    marginVertical: 16,
    padding: 20,
    borderRadius: 16,
  },
  quizHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  quizTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  quizQuestion: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  optionsContainer: {
    marginBottom: 20,
  },
  optionButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  quizActions: {
    alignItems: 'center',
  },
  quizButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  quizButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  answerContainer: {
    alignItems: 'center',
  },
  answerLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  answerText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  selectedAnswer: {
    fontSize: 16,
    fontWeight: '500',
  },
  warningContainer: {
    marginVertical: 16,
    padding: 20,
    borderRadius: 16,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  warningText: {
    fontSize: 16,
    lineHeight: 24,
  },
  noteContainer: {
    marginVertical: 16,
    padding: 20,
    borderRadius: 16,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  noteText: {
    fontSize: 16,
    lineHeight: 24,
  },
  imageContainer: {
    marginVertical: 16,
    alignItems: 'center',
  },
  image: {
    width: width - 32,
    height: 200,
    borderRadius: 12,
  },
  imageCaption: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  videoContainer: {
    marginVertical: 16,
    alignItems: 'center',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 32,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LessonScreen; 