import { useState, useEffect, useCallback } from 'react';
import { quizApi, quizEngApi, badgeApi } from '../services/api';

interface QuizStats {
  // Genel istatistikler
  totalQuizzes: number;
  completedQuizzes: number;
  totalXP: number;
  averageScore: number;
  perfectQuizzes: number;
  totalSolvedQuestions: number;
  currentStreak: number;
  
  // Skill bazında istatistikler
  skillStats: Array<{
    skillId: string;
    skillName: string;
    completedQuizzes: number;
    averageScore: number;
    totalXP: number;
    perfectQuizzes: number;
  }>;
  
  // Badge istatistikleri
  badges: any[];
  totalBadges: number;
  
  // Loading states
  loading: boolean;
  error: string | null;
}

export const useQuizStats = (language: 'tr' | 'en') => {
  const [stats, setStats] = useState<QuizStats>({
    totalQuizzes: 0,
    completedQuizzes: 0,
    totalXP: 0,
    averageScore: 0,
    perfectQuizzes: 0,
    totalSolvedQuestions: 0,
    currentStreak: 0,
    skillStats: [],
    badges: [],
    totalBadges: 0,
    loading: true,
    error: null,
  });

  const loadStats = useCallback(async () => {
    try {
      console.log('🔄 Quiz istatistikleri yükleniyor...', { language });
      setStats(prev => ({ ...prev, loading: true, error: null }));
      
      // Dil seçimine göre API seç
      const quizApiToUse = language === 'en' ? quizEngApi : quizApi;
      
      // Paralel olarak tüm verileri çek
      const [userStatsRes, userProgressRes, badgesRes] = await Promise.allSettled([
        quizApiToUse.getUserStats(),
        quizApiToUse.getUserProgress(),
        badgeApi.getUserBadges(),
      ]);

      // User stats
      let userStats: any = {};
      if (userStatsRes.status === 'fulfilled') {
        userStats = userStatsRes.value.data;
        console.log('✅ User stats loaded:', userStats);
      } else {
        console.warn('❌ User stats failed:', userStatsRes.reason);
      }

      // Progress stats — API raw quiz_progress dizisi veya aggregated skill listesi dönebilir
      let progressStats: any[] = [];
      if (userProgressRes.status === 'fulfilled') {
        const raw = userProgressRes.value.data || [];
        if (Array.isArray(raw) && raw.length && raw[0]?.quizId) {
          const skillNames: Record<string, string> = {
            variables: language === 'en' ? 'Variables' : 'Değişkenler',
            operators: language === 'en' ? 'Operators' : 'Operatörler',
            loops: language === 'en' ? 'Loops' : 'Döngüler',
            functions: language === 'en' ? 'Functions' : 'Fonksiyonlar',
            pointers: language === 'en' ? 'Pointers' : 'Pointerlar',
          };
          const map: Record<string, any> = {};
          for (const p of raw) {
            if (!p.isCompleted) continue;
            const sid = p.skillId || 'general';
            if (!map[sid]) {
              map[sid] = {
                skillId: sid,
                skillName: skillNames[sid] || sid,
                completedQuizzes: 0,
                totalXP: 0,
                perfectQuizzes: 0,
                scoreSum: 0,
              };
            }
            map[sid].completedQuizzes += 1;
            map[sid].totalXP += p.xpEarned || 0;
            if (p.isPerfect) map[sid].perfectQuizzes += 1;
            const ratio =
              p.totalScore > 0 ? (p.score / p.totalScore) * 100 : 0;
            map[sid].scoreSum += ratio;
          }
          progressStats = Object.values(map).map((s: any) => ({
            skillId: s.skillId,
            skillName: s.skillName,
            completedQuizzes: s.completedQuizzes,
            totalXP: s.totalXP,
            perfectQuizzes: s.perfectQuizzes,
            averageScore:
              s.completedQuizzes > 0 ? s.scoreSum / s.completedQuizzes : 0,
          }));
        } else {
          progressStats = raw;
        }
        console.log('✅ Progress stats loaded:', progressStats.length, 'skills');
      } else {
        console.warn('❌ Progress stats failed:', userProgressRes.reason);
      }

      // Badge stats
      let badges: any[] = [];
      if (badgesRes.status === 'fulfilled') {
        badges = badgesRes.value.data || [];
        console.log('✅ Badges loaded:', badges.length, 'badges');
      } else {
        console.warn('❌ Badges failed:', badgesRes.reason);
      }

      // Verileri normalize et
      const normalizedStats = {
        totalQuizzes: userStats.totalQuizzes || userStats.totalCompletedQuizzes || 0,
        completedQuizzes: userStats.totalCompletedQuizzes || userStats.completedQuizzes || 0,
        totalXP: userStats.totalXP || 0,
        averageScore: userStats.averageScore || 0,
        perfectQuizzes: userStats.totalPerfectQuizzes || userStats.perfectQuizzes || 0,
        totalSolvedQuestions: userStats.totalSolvedQuestions || 0,
        currentStreak: userStats.currentStreak || 0,
        skillStats: progressStats,
        badges,
        totalBadges: badges.length,
        loading: false,
        error: null,
      };

      console.log('🎯 Final normalized stats:', normalizedStats);
      setStats(normalizedStats);

    } catch (error) {
      console.error('❌ Quiz istatistikleri yüklenirken hata:', error);
      setStats(prev => ({
        ...prev,
        loading: false,
        error: 'İstatistikler yüklenirken hata oluştu',
      }));
    }
  }, [language]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const refresh = useCallback(async () => {
    console.log('🔄 Quiz istatistikleri yenileniyor...');
    await loadStats();
  }, [loadStats]);

  // Performans hesaplamaları
  const getPerformanceColor = useCallback(() => {
    if (stats.averageScore >= 80) return '#58CC02'; // success
    if (stats.averageScore >= 60) return '#FF9600'; // warning
    return '#FF4B4B'; // error
  }, [stats.averageScore]);

  const getPerformanceText = useCallback(() => {
    if (stats.averageScore >= 80) return language === 'en' ? 'Excellent' : 'Mükemmel';
    if (stats.averageScore >= 60) return language === 'en' ? 'Good' : 'İyi';
    return language === 'en' ? 'Needs Improvement' : 'Geliştirilmeli';
  }, [stats.averageScore, language]);

  return {
    ...stats,
    refresh,
    getPerformanceColor,
    getPerformanceText,
  };
}; 