import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Alert,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { lessonsApi } from '../services/api';
import FuturisticNavbar from '../components/FuturisticNavbar';
import {
  Chapter,
  Topic,
  Lesson,
  UserLessonProgress,
  Language,
  Locale,
} from '../types/lessons';

interface LessonsListScreenProps {
  navigation: any;
}

const LessonsListScreen: React.FC<LessonsListScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();
  
  // State for new lessons system
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [userProgress, setUserProgress] = useState<UserLessonProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('cpp');
  const [selectedLocale, setSelectedLocale] = useState<Locale>('tr');
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  /* ----------------------------- Veri Yükle ------------------------------- */
  useEffect(() => {
    loadData();
  }, [selectedLanguage, selectedLocale]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 Starting data load...');
      console.log('🔍 Language:', selectedLanguage);
      console.log('🔍 Locale:', selectedLocale);
      
      // 1. Chapters'ları çek
      console.log('🔍 Fetching chapters...');
      const chaptersResponse = await lessonsApi.getChapters(selectedLanguage, selectedLocale);
      console.log('🔍 Chapters API response:', chaptersResponse);
      console.log('🔍 Chapters response status:', chaptersResponse.status);
      console.log('🔍 Chapters response data:', chaptersResponse.data);
      
      if (chaptersResponse.data && Array.isArray(chaptersResponse.data)) {
        setChapters(chaptersResponse.data);
        console.log('✅ Chapters loaded:', chaptersResponse.data.length);
        console.log('✅ Chapters:', chaptersResponse.data.map(c => ({ id: c._id, title: c.title })));
      } else {
        console.error('❌ Invalid chapters response:', chaptersResponse);
        setChapters([]);
      }

      // 2. Her chapter için topics'leri çek
      console.log('🔍 Fetching topics for chapters...');
      const allTopics: Topic[] = [];
      for (const chapter of chaptersResponse.data || []) {
        try {
          console.log(`🔍 Fetching topics for chapter: ${chapter.title} (${chapter._id})`);
          const topicsResponse = await lessonsApi.getTopicsByChapter(chapter._id, selectedLanguage, selectedLocale);
          console.log(`🔍 Topics response for chapter ${chapter._id}:`, topicsResponse);
          
          if (topicsResponse.data && Array.isArray(topicsResponse.data)) {
            allTopics.push(...topicsResponse.data);
            console.log(`✅ Topics for chapter ${chapter._id}:`, topicsResponse.data.length);
          }
        } catch (err) {
          console.error(`❌ Error fetching topics for chapter ${chapter._id}:`, err);
        }
      }
      setTopics(allTopics);
      console.log('✅ All topics loaded:', allTopics.length);

      // 3. Her topic için lessons'ları çek
      console.log('🔍 Fetching lessons for topics...');
      const allLessons: Lesson[] = [];
      for (const topic of allTopics) {
        try {
          console.log(`🔍 Fetching lessons for topic: ${topic.title} (${topic._id})`);
          const lessonsResponse = await lessonsApi.getLessonsByTopic(topic._id, selectedLanguage, selectedLocale);
          console.log(`🔍 Lessons response for topic ${topic._id}:`, lessonsResponse);
          
          if (lessonsResponse.data && Array.isArray(lessonsResponse.data)) {
            allLessons.push(...lessonsResponse.data);
            console.log(`✅ Lessons for topic ${topic._id}:`, lessonsResponse.data.length);
          }
        } catch (err) {
          console.error(`❌ Error fetching lessons for topic ${topic._id}:`, err);
        }
      }
      setLessons(allLessons);
      console.log('✅ All lessons loaded:', allLessons.length);

      /* Progress (opsiyonel) */
      try {
        console.log('🔍 Fetching user progress...');
        const progressResponse = await lessonsApi.getUserProgress(selectedLanguage, selectedLocale);
        console.log('🔍 Progress response:', progressResponse);
        if (progressResponse.data && progressResponse.data.progress) {
          setUserProgress(progressResponse.data.progress);
        } else {
          setUserProgress([]);
        }
      } catch (err) {
        console.log('⚠️ Progress fetch error:', err);
        setUserProgress([]);
      }
    } catch (error) {
      console.error('❌ Error loading data:', error);
      Alert.alert('Hata', 'Dersler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
      console.log('🏁 Data loading completed');
    }
  };

  const handleLanguageChange = (language: Language, locale: Locale) => {
    setSelectedLanguage(language);
    setSelectedLocale(locale);
    setShowLanguageSelector(false);
  };

  const getLanguageDisplayName = (language: Language, locale: Locale) => {
    if (language === 'cpp' && locale === 'tr') return 'C++ (Türkçe)';
    if (language === 'cpp' && locale === 'en') return 'C++ (English)';
    if (language === 'c' && locale === 'tr') return 'C (Türkçe)';
    if (language === 'c' && locale === 'en') return 'C (English)';
    return `${language.toUpperCase()} (${locale.toUpperCase()})`;
  };

  const handleChapterPress = (chapter: Chapter) => {
    const chapterTopics = topics.filter(t => t.chapterId === chapter._id);
    const chapterLessons = lessons.filter(l => 
      chapterTopics.some(t => t._id === l.topicId)
    );
    
    console.log(`Chapter ${chapter.title} pressed:`, {
      topics: chapterTopics.length,
      lessons: chapterLessons.length
    });
    
    // Chapter detay sayfasına git (gelecekte implement edilebilir)
    Alert.alert('Bilgi', `${chapter.title} bölümünde ${chapterTopics.length} konu ve ${chapterLessons.length} ders bulunuyor.`);
  };

  const handleTopicPress = (topic: Topic) => {
    const topicLessons = lessons.filter(l => l.topicId === topic._id);
    console.log(`Topic ${topic.title} pressed:`, topicLessons.length);
    
    // Topic detay sayfasına git (gelecekte implement edilebilir)
    Alert.alert('Bilgi', `${topic.title} konusunda ${topicLessons.length} ders bulunuyor.`);
  };

  const handleLessonPress = (lesson: Lesson) => {
    console.log('Lesson pressed:', lesson.title);
    navigation.navigate('LessonScreen', {
      lessonId: lesson._id,
      language: selectedLanguage,
      locale: selectedLocale,
    });
  };

  const getProgressForLesson = (lessonId: string) => {
    return userProgress.find(p => p.lessonId === lessonId);
  };

  /* --------------------------- Loading Ekranı --------------------------- */
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.text }]}>Dersler yükleniyor...</Text>
      </View>
    );
  }

  /* ------------------------------ UI ------------------------------ */
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <FuturisticNavbar 
        title={`${selectedLanguage === 'cpp' ? 'C++' : 'C'} Dersleri`} 
        rightIcon="language-outline"
        onRightPress={() => setShowLanguageSelector(!showLanguageSelector)}
      />
      
      {/* Language Selector */}
      {showLanguageSelector && (
        <View style={[styles.languageSelector, { backgroundColor: colors.surface }]}>
          <Text style={[styles.languageTitle, { color: colors.text }]}>Dil Seçin</Text>
          <View style={styles.languageOptions}>
            <TouchableOpacity
              style={[
                styles.languageOption,
                { 
                  backgroundColor: selectedLanguage === 'cpp' && selectedLocale === 'tr' 
                    ? colors.primary 
                    : colors.surfaceSecondary 
                }
              ]}
              onPress={() => handleLanguageChange('cpp', 'tr')}
            >
              <Text style={[
                styles.languageText,
                { 
                  color: selectedLanguage === 'cpp' && selectedLocale === 'tr' 
                    ? colors.textOnPrimary 
                    : colors.text 
                }
              ]}>
                C++ (Türkçe)
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.languageOption,
                { 
                  backgroundColor: selectedLanguage === 'cpp' && selectedLocale === 'en' 
                    ? colors.primary 
                    : colors.surfaceSecondary 
                }
              ]}
              onPress={() => handleLanguageChange('cpp', 'en')}
            >
              <Text style={[
                styles.languageText,
                { 
                  color: selectedLanguage === 'cpp' && selectedLocale === 'en' 
                    ? colors.textOnPrimary 
                    : colors.text 
                }
              ]}>
                C++ (English)
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.languageOption,
                { 
                  backgroundColor: selectedLanguage === 'c' && selectedLocale === 'tr' 
                    ? colors.primary 
                    : colors.surfaceSecondary 
                }
              ]}
              onPress={() => handleLanguageChange('c', 'tr')}
            >
              <Text style={[
                styles.languageText,
                { 
                  color: selectedLanguage === 'c' && selectedLocale === 'tr' 
                    ? colors.textOnPrimary 
                    : colors.text 
                }
              ]}>
                C (Türkçe)
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.languageOption,
                { 
                  backgroundColor: selectedLanguage === 'c' && selectedLocale === 'en' 
                    ? colors.primary 
                    : colors.surfaceSecondary 
                }
              ]}
              onPress={() => handleLanguageChange('c', 'en')}
            >
              <Text style={[
                styles.languageText,
                { 
                  color: selectedLanguage === 'c' && selectedLocale === 'en' 
                    ? colors.textOnPrimary 
                    : colors.text 
                }
              ]}>
                C (English)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {chapters.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Henüz ders bulunmuyor.
            </Text>
            <Text style={[styles.emptySubText, { color: colors.textSecondary }]}>
              {getLanguageDisplayName(selectedLanguage, selectedLocale)} için dersler henüz eklenmemiş.
            </Text>
          </View>
        ) : (
          chapters.map((chapter) => {
            const chapterTopics = topics.filter(t => t.chapterId === chapter._id);
            
            return (
              <View key={chapter._id} style={[styles.chapterBox, { backgroundColor: colors.surface }]}>
                <TouchableOpacity onPress={() => handleChapterPress(chapter)}>
                  <Text style={[styles.chapterTitle, { color: colors.primary }]}>{chapter.title}</Text>
                  <Text style={[styles.chapterDesc, { color: colors.textSecondary }]}>{chapter.description}</Text>
                  <Text style={[styles.chapterMeta, { color: colors.textSecondary }]}>
                    {chapterTopics.length} konu • {chapter.estimatedTime} dk
                  </Text>
                </TouchableOpacity>
                
                {/* Topics */}
                {chapterTopics.map(topic => {
                  const topicLessons = lessons.filter(l => l.topicId === topic._id);
                  const completedLessons = topicLessons.filter(l => 
                    getProgressForLesson(l._id)?.isCompleted
                  );
                  
                  return (
                    <View key={topic._id} style={[styles.topicBox, { backgroundColor: colors.surfaceSecondary }]}>
                      <TouchableOpacity onPress={() => handleTopicPress(topic)}>
                        <Text style={[styles.topicTitle, { color: colors.text }]}>{topic.title}</Text>
                        <Text style={[styles.topicDesc, { color: colors.textSecondary }]}>{topic.description}</Text>
                        <Text style={[styles.topicMeta, { color: colors.textSecondary }]}>
                          {completedLessons.length}/{topicLessons.length} ders tamamlandı • {topic.estimatedTime} dk
                        </Text>
                      </TouchableOpacity>
                      
                      {/* Lessons */}
                      {topicLessons.map(lesson => {
                        const progress = getProgressForLesson(lesson._id);
                        
                        return (
                          <TouchableOpacity
                            key={lesson._id}
                            style={[
                              styles.lessonBox,
                              { 
                                backgroundColor: progress?.isCompleted ? colors.success + '20' : colors.surface,
                                borderColor: progress?.isCompleted ? colors.success : colors.border
                              }
                            ]}
                            onPress={() => handleLessonPress(lesson)}
                          >
                            <View style={styles.lessonHeader}>
                              <Text style={[styles.lessonTitle, { color: colors.text }]}>
                                {lesson.title}
                              </Text>
                              {progress?.isCompleted && (
                                <Text style={[styles.completedBadge, { color: colors.success }]}>✓</Text>
                              )}
                            </View>
                            <Text style={[styles.lessonDesc, { color: colors.textSecondary }]}>
                              {lesson.description}
                            </Text>
                            <Text style={[styles.lessonMeta, { color: colors.textSecondary }]}>
                              {lesson.estimatedTime} dk • {lesson.difficulty}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  );
                })}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

/* -------------------------------- STYLES -------------------------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 40,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
  languageSelector: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  languageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  languageOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  languageOption: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  languageText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chapterBox: {
    marginBottom: 32,
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chapterTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  chapterDesc: {
    fontSize: 14,
    marginBottom: 8,
  },
  chapterMeta: {
    fontSize: 12,
    fontWeight: '500',
  },
  topicBox: {
    marginTop: 16,
    marginLeft: 8,
    padding: 12,
    borderRadius: 12,
  },
  topicTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  topicDesc: {
    fontSize: 13,
    marginBottom: 6,
  },
  topicMeta: {
    fontSize: 11,
    fontWeight: '500',
  },
  lessonBox: {
    marginTop: 12,
    marginLeft: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  lessonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  lessonTitle: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  completedBadge: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  lessonDesc: {
    fontSize: 12,
    marginBottom: 4,
  },
  lessonMeta: {
    fontSize: 10,
    fontWeight: '500',
  },
});

export default LessonsListScreen;
