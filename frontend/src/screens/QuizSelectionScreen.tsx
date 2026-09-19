import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  SectionList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Platform,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../theme/ThemeProvider';
import { useI18n } from '../i18n/i18nProvider';
import { quizApi, quizEngApi } from '../services/api';
import { Quiz } from '../types/quiz';
import { useQuizStats } from '../hooks/useQuizStats';

/* -------------------------------------------------------------------------- */
/*                                   CONSTS                                   */
/* -------------------------------------------------------------------------- */

const DIFF_ORDER: ('easy' | 'medium' | 'hard' | 'other')[] = [
  'easy',
  'medium',
  'hard',
  'other',
];

const diffInfo = {
  easy:  { color: '#58CC02', icon: 'leaf',   labelTr: 'Kolay', labelEn: 'Easy'  },
  medium:{ color: '#FF9600', icon: 'flame',  labelTr: 'Orta',  labelEn: 'Medium'   },
  hard:  { color: '#FF4B4B', icon: 'diamond',labelTr: 'Zor',   labelEn: 'Hard'    },
  other: { color: '#8E8EA0', icon: 'star',   labelTr: 'Diğer', labelEn: 'Other'  },
};

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

const QuizSelectionScreen: React.FC = () => {
  const { colors } = useTheme();
  const { language, t } = useI18n();
  const navigation = useNavigation();
  const { width } = useWindowDimensions();

  // ✅ ORTAK İSTATİSTİK HOOK KULLAN
  const {
    totalQuizzes,
    completedQuizzes,
    averageScore,
    totalXP,
    loading: statsLoading,
    refresh: refreshStats,
  } = useQuizStats(language);

  /* ------------------------------ STATE ------------------------------ */
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* ----------------------------- FETCH ------------------------------- */
  const fetchQuizzes = useCallback(async () => {
    try {
      const api = language === 'en' ? quizEngApi : quizApi;
      const res = await api.getAllQuizzes();
      setQuizzes(res.data ?? []);
    } catch (error) {
      console.error('Quiz yüklenirken hata:', error);
      setQuizzes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [language]);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchQuizzes();
    refreshStats(); // ✅ İstatistikleri de yenile
  };

  /* ---------------------------- SECTIONS ----------------------------- */
  const sections = useMemo(() => {
    const grouped: Record<string, Quiz[]> = {};
    quizzes.forEach((q) => {
      const key = (q.difficulty ?? 'other').toLowerCase();
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(q);
    });
    return DIFF_ORDER
      .map((key) => ({
        key,
        data: grouped[key] ?? [],
      }))
      .filter((s) => s.data.length); // boşları at
  }, [quizzes]);

  /* ---------------------------- HANDLERS ----------------------------- */
  const handleQuizSelect = (quiz: Quiz) => {
    (navigation as any).navigate('DuolingoQuiz', {
      quizId: quiz.id,
      skillName: quiz.title,
      language: language, // Dil bilgisini geçir
    });
  };

  const handleStatsPress = () => {
    (navigation as any).navigate('QuizStats', { language });
  };

  /* ---------------------------- RENDERERS ---------------------------- */
  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          {language === 'en' ? 'Loading quizzes...' : 'Quiz\'ler yükleniyor...'}
        </Text>
      </View>
    );
  }

  if (!sections.length) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Ionicons name="help-circle" size={64} color={colors.textSecondary} />
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          {language === 'en' ? 'No quizzes found' : 'Quiz bulunamadı'}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={onRefresh}
        >
          <Text style={styles.retryButtonText}>
            {language === 'en' ? 'Try Again' : 'Tekrar Dene'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.accent]}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {language === 'en' ? 'Quiz Selection' : 'Quiz Seçimi'}
          </Text>
          <TouchableOpacity
            style={styles.statsButton}
            onPress={handleStatsPress}
          >
            <Ionicons name="stats-chart" size={24} color="white" />
          </TouchableOpacity>
        </View>
        
        {/* ✅ ORTAK İSTATİSTİKLER */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="trophy" size={20} color="white" />
            <Text style={styles.statValue}>{completedQuizzes}</Text>
            <Text style={styles.statLabel}>
              {language === 'en' ? 'Completed' : 'Tamamlanan'}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="star" size={20} color="white" />
            <Text style={styles.statValue}>{averageScore.toFixed(1)}%</Text>
            <Text style={styles.statLabel}>
              {language === 'en' ? 'Average' : 'Ortalama'}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="flash" size={20} color="white" />
            <Text style={styles.statValue}>{totalXP}</Text>
            <Text style={styles.statLabel}>XP</Text>
          </View>
        </View>
      </LinearGradient>

      <SectionList
        sections={sections}
        /* -------- Section Header -- */
        renderSectionHeader={({ section }) => {
          const { color, icon, labelTr, labelEn } = diffInfo[section.key as keyof typeof diffInfo];
          const label = language === 'en' ? labelEn : labelTr;
          return (
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <Ionicons name={icon as any} size={22} color={color} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {label} {language === 'en' ? 'Level' : 'Seviye'}
                </Text>
              </View>
              <Text
                style={[
                  styles.sectionCount,
                  { color: colors.textSecondary },
                ]}
              >
                {section.data.length} quiz
              </Text>
            </View>
          );
        }}
        /* -------- Item ------------ */
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                shadowColor: colors.primary,
              },
            ]}
            onPress={() => handleQuizSelect(item)}
            activeOpacity={0.7}
          >
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <Text
                  style={[styles.cardTitle, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <View style={[
                  styles.difficultyBadge,
                  { backgroundColor: diffInfo[item.difficulty || 'other'].color + '20' }
                ]}>
                  <Text style={[
                    styles.difficultyText,
                    { color: diffInfo[item.difficulty || 'other'].color }
                  ]}>
                    {language === 'en' ? diffInfo[item.difficulty || 'other'].labelEn : diffInfo[item.difficulty || 'other'].labelTr}
                  </Text>
                </View>
            </View>
              
              <Text
                style={[
                  styles.cardDesc,
                  { color: colors.textSecondary },
                ]}
                numberOfLines={2}
              >
                {item.description}
              </Text>
              
              <View style={styles.cardMeta}>
                <View style={styles.metaRow}>
                  <Ionicons
                    name="time"
                    size={14}
                    color={colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.metaTxt,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {item.estimatedTime || 5} dk
                  </Text>
                </View>
                
                <View style={styles.metaRow}>
                  <Ionicons
                    name="help-circle"
                    size={14}
                    color={colors.textSecondary}
                  />
                                     <Text
                     style={[
                       styles.metaTxt,
                       { color: colors.textSecondary },
                     ]}
                   >
                     {item.questions?.length || 10} soru
                   </Text>
                  </View>
                
                <View style={styles.metaRow}>
                  <Ionicons
                    name="flash"
                    size={14}
                    color={colors.accent}
                  />
                  <Text
                    style={[
                      styles.metaTxt,
                      { color: colors.accent },
                    ]}
                  >
                    {item.xpReward || 50} XP
                  </Text>
                </View>
              </View>
            </View>
            
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textTertiary}
            />
              </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
        /* -------- Pull-to-refresh -- */
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            progressBackgroundColor={colors.surfaceSecondary}
          />
        }
        /* -------- Stil ------------ */
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 40,
        }}
        stickySectionHeadersEnabled={false}
      />
    </SafeAreaView>
  );
};

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },

  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },

  emptyText: {
    fontSize: 18,
    marginTop: 16,
    textAlign: 'center',
  },

  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },

  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  headerGradient: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },

  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },

  statsButton: {
    padding: 8,
  },

  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
  },

  statItem: {
    alignItems: 'center',
  },

  statValue: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },

  statLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 12,
  },

  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginLeft: 8 
  },

  sectionCount: { 
    fontSize: 13, 
    opacity: 0.7 
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 4,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },

  cardContent: {
    flex: 1,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },

  cardTitle: { 
    fontSize: 16, 
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },

  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },

  difficultyText: {
    fontSize: 10,
    fontWeight: '600',
  },

  cardDesc: { 
    fontSize: 13, 
    opacity: 0.75, 
    marginBottom: 12,
    lineHeight: 18,
  },

  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  metaRow: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },

  metaTxt: { 
    fontSize: 12, 
    fontWeight: '500', 
    marginLeft: 4 
  },
});

export default QuizSelectionScreen; 