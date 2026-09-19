import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../theme/ThemeProvider';
import { useI18n } from '../i18n/i18nProvider';
import { quizApi, quizEngApi, badgeApi } from '../services/api';
import api from '../services/api';
import ModernBadgeCard from '../components/badges/ModernBadgeCard';
import { useQuizStats } from '../hooks/useQuizStats';

interface Badge {
  id: string;
  name: string;
  nameEn?: string;
  description: string;
  descriptionEn?: string;
  icon: string;
  color: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  category: string;
  unlockedAt?: string;
  isNew?: boolean;
  progress?: number;
}

const QuizStatsScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const { colors } = useTheme();
  const { language } = useI18n();
  const { language: routeLanguage } = route.params || {};

  // ✅ ORTAK İSTATİSTİK HOOK KULLAN
  const {
    totalQuizzes,
    completedQuizzes,
    totalXP,
    averageScore,
    perfectQuizzes,
    currentStreak,
    skillStats,
    badges,
    loading,
    error,
    refresh,
    getPerformanceColor,
    getPerformanceText,
  } = useQuizStats(routeLanguage || language);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

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

  // Badge progress indicator ekle
  const BadgeProgress = ({ badges, totalBadges }: { badges: Badge[]; totalBadges: number }) => (
    <View style={styles.badgeProgressContainer}>
      <View style={styles.badgeProgressBar}>
        <View
          style={[
            styles.badgeProgressFill,
            { width: `${(badges.length / totalBadges) * 100}%` },
          ]}
        />
      </View>
      <Text style={[styles.badgeProgressText, { color: colors.textSecondary }]}>
        {badges.length} / {totalBadges} {language === 'en' ? 'badges earned' : 'rozet kazanıldı'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {language === 'en' ? 'Statistics' : 'İstatistikler'}
          </Text>
          <View style={{ width: 40 }} />
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            {language === 'en' ? 'Loading...' : 'Yükleniyor...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.accent]}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>
          {language === 'en' ? 'Statistics' : 'İstatistikler'}
        </Text>
        
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
        >
          <Ionicons name="refresh" size={24} color="white" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* ✅ ORTAK GENEL İSTATİSTİKLER */}
        <View style={[styles.statsCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.primary }]}>
            {language === 'en' ? 'General Statistics' : 'Genel İstatistikler'}
          </Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Ionicons name="trophy" size={32} color={colors.accent} />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {completedQuizzes}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {language === 'en' ? 'Completed Quizzes' : 'Tamamlanan Quiz'}
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Ionicons name="star" size={32} color={colors.warning} />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {totalXP}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {language === 'en' ? 'Total XP' : 'Toplam XP'}
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Ionicons name="checkmark-circle" size={32} color={colors.success} />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {perfectQuizzes}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {language === 'en' ? 'Perfect Scores' : 'Mükemmel Skor'}
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Ionicons name="flame" size={32} color={colors.error} />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {currentStreak}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {language === 'en' ? 'Current Streak' : 'Günlük Seri'}
              </Text>
            </View>
          </View>
        </View>

        {/* ✅ ORTAK PERFORMANS KARTI */}
        <View style={[styles.performanceCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.primary }]}>
            {language === 'en' ? 'Performance' : 'Performans'}
          </Text>
          
          <View style={styles.performanceItem}>
            <View style={styles.performanceHeader}>
              <Text style={[styles.performanceLabel, { color: colors.text }]}>
                {language === 'en' ? 'Average Score' : 'Ortalama Skor'}
              </Text>
              <Text style={[styles.performanceValue, { color: colors.text }]}>
                {averageScore.toFixed(1)}%
              </Text>
            </View>
            <View style={[styles.progressBar, { backgroundColor: colors.surfaceSecondary }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: getPerformanceColor(),
                    width: `${Math.min(averageScore, 100)}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.performanceText, { color: colors.textSecondary }]}>
              {getPerformanceText()}
            </Text>
          </View>
        </View>

        {/* ✅ ORTAK SKILL İSTATİSTİKLERİ */}
        {skillStats.length > 0 && (
          <View style={[styles.skillCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.cardTitle, { color: colors.primary }]}>
              {language === 'en' ? 'Skill Performance' : 'Skill Bazında Performans'}
            </Text>
            
            {skillStats.map((skill, index) => (
              <View key={index} style={styles.skillItem}>
                <View style={styles.skillHeader}>
                  <Text style={[styles.skillName, { color: colors.text }]}>
                    {skill.skillName}
                  </Text>
                  <Text style={[styles.skillScore, { color: colors.text }]}>
                    {skill.averageScore?.toFixed(1) || 0}%
                  </Text>
                </View>
                <View style={styles.skillMeta}>
                  <Text style={[styles.skillMetaText, { color: colors.textSecondary }]}>
                    {skill.completedQuizzes} {language === 'en' ? 'quizzes completed' : 'quiz tamamlandı'}
                  </Text>
                  <Text style={[styles.skillMetaText, { color: colors.textSecondary }]}>
                    {skill.totalXP} {language === 'en' ? 'XP earned' : 'XP kazanıldı'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ✅ ORTAK BADGE SİSTEMİ */}
        <View style={[styles.badgesCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.primary }]}>
            {language === 'en' ? 'Achievement Badges' : 'Başarı Rozetleri'} ({badges.length})
          </Text>
          
          {badges.length > 0 ? (
            <View style={styles.badgesGrid}>
              {badges.map((badge, index) => (
                <ModernBadgeCard 
                  key={badge.id} 
                  badge={badge} 
                  index={index}
                  language={language}
                  isUnlocked={true}
                  onPress={() => {
                    console.log('Badge pressed:', badge.name);
                  }}
                />
              ))}
            </View>
          ) : (
            <Text style={[styles.noBadgesText, { color: colors.textSecondary }]}>
              {language === 'en' ? 'No badges earned yet. Keep solving quizzes!' : 'Henüz rozet kazanmadın. Quiz çözmeye devam et!'}
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  refreshButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  performanceCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  performanceItem: {
    marginBottom: 16,
  },
  performanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  performanceLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  performanceValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  performanceText: {
    fontSize: 14,
    fontWeight: '500',
  },
  skillCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  skillItem: {
    marginBottom: 20,
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  skillName: {
    fontSize: 16,
    fontWeight: '600',
  },
  skillScore: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  skillMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  skillMetaText: {
    fontSize: 12,
  },
  badgesCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  badgeItem: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  badgeIconContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  newBadgeIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  newBadgeText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: 'white',
  },
  badgeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
  },
  badgeDesc: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  badgeDate: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
  },
  noBadgesText: {
    textAlign: 'center',
    fontSize: 16,
    fontStyle: 'italic',
    marginTop: 20,
  },
  badgeProgressContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  badgeProgressBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  badgeProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  badgeProgressText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default QuizStatsScreen; 