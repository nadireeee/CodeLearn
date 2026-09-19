import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import { Badge, BadgeDocument } from '../entities/badge.entity';
import { UserBadge, UserBadgeDocument } from '../entities/user-badge.entity';
import { QuizProgress, QuizProgressDocument } from '../entities/quiz-progress.entity';
import { User } from '../entities/user.entity';

interface BadgeCondition {
  type: 'xp' | 'quiz_count' | 'perfect_score' | 'streak' | 'first_quiz' | 'question_solver' | 'project_creator' | 'time_based' | 'special';
  value: number;
  operator: 'gte' | 'eq' | 'lte';
}

interface BadgeReward {
  xp: number;
  title?: string;
  unlockFeatures?: string[];
}

@Injectable()
export class BadgeService {
  private readonly logger = new Logger(BadgeService.name);

  constructor(
    @InjectModel(Badge.name) private badgeModel: Model<BadgeDocument>,
    @InjectModel(UserBadge.name) private userBadgeModel: Model<UserBadgeDocument>,
    @InjectModel(QuizProgress.name) private quizProgressModel: Model<QuizProgressDocument>,
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  // 🎯 Geliştirilmiş Badge Sistemi
  async createModernBadges(): Promise<void> {
    const modernBadges = [
      // 🏆 Başlangıç Rozetleri
      {
        id: 'welcome',
        name: 'Hoş Geldin!',
        nameEn: 'Welcome!',
        description: 'Platforma başarıyla kayıt oldun!',
        descriptionEn: 'Successfully registered to the platform!',
        icon: 'hand-wave',
        color: '#00D4FF',
        rarity: 'common',
        category: 'welcome',
        condition: { type: 'special', value: 1, operator: 'eq' },
        reward: { xp: 10, title: 'Yeni Üye' },
        unlocksAt: 'registration',
      },
      
      // 🎓 Öğrenme Rozetleri
      {
        id: 'first_quiz',
        name: 'İlk Adım',
        nameEn: 'First Step',
        description: 'İlk quizini başarıyla tamamladın!',
        descriptionEn: 'Successfully completed your first quiz!',
        icon: 'school',
        color: '#34D399',
        rarity: 'common',
        category: 'learning',
        condition: { type: 'quiz_count', value: 1, operator: 'gte' },
        reward: { xp: 25, title: 'Öğrenci' },
        unlocksAt: 'quiz_complete',
      },
      
      {
        id: 'quiz_master_10',
        name: 'Quiz Ustası',
        nameEn: 'Quiz Master',
        description: '10 quiz tamamladın!',
        descriptionEn: 'Completed 10 quizzes!',
        icon: 'trophy',
        color: '#FFD700',
        rarity: 'rare',
        category: 'learning',
        condition: { type: 'quiz_count', value: 10, operator: 'gte' },
        reward: { xp: 100, title: 'Quiz Ustası', unlockFeatures: ['advanced_quizzes'] },
        unlocksAt: 'quiz_complete',
      },
      
      // 🔥 Mükemmellik Rozetleri
      {
        id: 'perfectionist',
        name: 'Mükemmeliyetçi',
        nameEn: 'Perfectionist',
        description: 'Bir quizde %100 skor aldın!',
        descriptionEn: 'Scored 100% on a quiz!',
        icon: 'diamond',
        color: '#8B5CF6',
        rarity: 'epic',
        category: 'perfection',
        condition: { type: 'perfect_score', value: 1, operator: 'gte' },
        reward: { xp: 50, title: 'Mükemmeliyetçi' },
        unlocksAt: 'quiz_perfect',
      },
      
      {
        id: 'perfect_streak_5',
        name: 'Şampiyon',
        nameEn: 'Champion',
        description: 'Üst üste 5 mükemmel quiz!',
        descriptionEn: '5 perfect quizzes in a row!',
        icon: 'flame',
        color: '#FF6B6B',
        rarity: 'legendary',
        category: 'perfection',
        condition: { type: 'streak', value: 5, operator: 'gte' },
        reward: { xp: 200, title: 'Şampiyon', unlockFeatures: ['champion_badge'] },
        unlocksAt: 'quiz_perfect',
      },
      
      // 💎 XP Rozetleri
      {
        id: 'xp_novice',
        name: 'Acemi',
        nameEn: 'Novice',
        description: '100 XP kazandın!',
        descriptionEn: 'Earned 100 XP!',
        icon: 'star',
        color: '#34D399',
        rarity: 'common',
        category: 'progress',
        condition: { type: 'xp', value: 100, operator: 'gte' },
        reward: { xp: 25, title: 'Acemi' },
        unlocksAt: 'xp_milestone',
      },
      
      {
        id: 'xp_expert',
        name: 'Uzman',
        nameEn: 'Expert',
        description: '500 XP kazandın!',
        descriptionEn: 'Earned 500 XP!',
        icon: 'flash',
        color: '#FFD700',
        rarity: 'rare',
        category: 'progress',
        condition: { type: 'xp', value: 500, operator: 'gte' },
        reward: { xp: 100, title: 'Uzman', unlockFeatures: ['expert_mode'] },
        unlocksAt: 'xp_milestone',
      },
      
      {
        id: 'xp_master',
        name: 'Büyük Usta',
        nameEn: 'Grand Master',
        description: '1000 XP kazandın!',
        descriptionEn: 'Earned 1000 XP!',
        icon: 'crown',
        color: '#8B5CF6',
        rarity: 'legendary',
        category: 'progress',
        condition: { type: 'xp', value: 1000, operator: 'gte' },
        reward: { xp: 250, title: 'Büyük Usta', unlockFeatures: ['master_mode', 'custom_themes'] },
        unlocksAt: 'xp_milestone',
      },
      
      // 🔧 Kod Rozetleri
      {
        id: 'code_creator',
        name: 'Kod Yaratıcısı',
        nameEn: 'Code Creator',
        description: 'İlk projenizi oluşturdun!',
        descriptionEn: 'Created your first project!',
        icon: 'code',
        color: '#00D4FF',
        rarity: 'rare',
        category: 'coding',
        condition: { type: 'project_creator', value: 1, operator: 'gte' },
        reward: { xp: 75, title: 'Kod Yaratıcısı' },
        unlocksAt: 'project_create',
      },
      
      // 🎯 Özel Rozetler
      {
        id: 'early_bird',
        name: 'Erken Kuş',
        nameEn: 'Early Bird',
        description: 'Sabah 08:00\'dan önce quiz çözdün!',
        descriptionEn: 'Solved a quiz before 08:00 AM!',
        icon: 'sunny',
        color: '#FBBF24',
        rarity: 'uncommon',
        category: 'special',
        condition: { type: 'time_based', value: 8, operator: 'lte' },
        reward: { xp: 30, title: 'Erken Kuş' },
        unlocksAt: 'time_based',
      },
      
      {
        id: 'night_owl',
        name: 'Gece Kuşu',
        nameEn: 'Night Owl',
        description: 'Gece 22:00\'dan sonra quiz çözdün!',
        descriptionEn: 'Solved a quiz after 22:00 PM!',
        icon: 'moon',
        color: '#6366F1',
        rarity: 'uncommon',
        category: 'special',
        condition: { type: 'time_based', value: 22, operator: 'gte' },
        reward: { xp: 30, title: 'Gece Kuşu' },
        unlocksAt: 'time_based',
      },
    ];

    for (const badge of modernBadges) {
      const existingBadge = await this.badgeModel.findOne({ id: badge.id });
      if (!existingBadge) {
        await this.badgeModel.create(badge);
        this.logger.log(`Created badge: ${badge.name}`);
      }
    }
  }

  // 🎖️ Kullanıcı rozetlerini getir (geliştiriliş)
  async getUserBadges(userId: string): Promise<any[]> {
    const userBadges = await this.userBadgeModel
      .find({ userId })
      .populate('badgeId')
      .sort({ unlockedAt: -1 })
      .exec();

    return userBadges.map(ub => {
      const badge = ub.badgeId as any;
      return {
        ...badge.toObject(),
        unlockedAt: ub.unlockedAt,
        isNew: ub.isNew,
      };
    });
  }

  // 🏆 Rozet kontrol ve verme sistemi (geliştirilmiş)
  async checkAndAwardBadges(userId: string, userStats: any): Promise<string[]> {
    const allBadges = await this.badgeModel.find().exec();
    const userBadges = await this.userBadgeModel.find({ userId }).exec();
    const userBadgeIds = userBadges.map(ub => ub.badgeId.toString());

    const newlyAwarded: string[] = [];

    for (const badge of allBadges) {
      if (userBadgeIds.includes(badge._id.toString())) continue;

      const shouldAward = await this.checkBadgeCondition(badge, userStats, userId);

      if (shouldAward) {
        await this.awardBadge(userId, badge);
        newlyAwarded.push(badge.name);
      }
    }

    return newlyAwarded;
  }

  // 🎯 Rozet koşulu kontrol et
  private async checkBadgeCondition(badge: any, userStats: any, userId: string): Promise<boolean> {
    const condition = badge.condition;
    
    switch (condition.type) {
      case 'xp':
        return this.checkCondition(userStats.totalXP, condition.value, condition.operator);
      case 'quiz_count':
        return this.checkCondition(userStats.totalCompletedQuizzes, condition.value, condition.operator);
      case 'perfect_score':
        return this.checkCondition(userStats.totalPerfectQuizzes, condition.value, condition.operator);
      case 'streak':
        return this.checkCondition(userStats.currentStreak, condition.value, condition.operator);
      case 'first_quiz':
        return this.checkCondition(userStats.totalCompletedQuizzes, condition.value, condition.operator);
      case 'question_solver':
        return this.checkCondition(userStats.totalSolvedQuestions, condition.value, condition.operator);
      case 'project_creator':
        return this.checkCondition(userStats.totalCreatedProjects, condition.value, condition.operator);
      case 'time_based':
        return await this.checkTimeBased(userId, condition.value, condition.operator);
      case 'special':
        return true; // Özel rozetler manuel olarak verilir
      default:
        return false;
    }
  }

  // 🔍 Koşul kontrolü
  private checkCondition(value: number, target: number, operator: string): boolean {
    switch (operator) {
      case 'gte': return value >= target;
      case 'eq': return value === target;
      case 'lte': return value <= target;
      default: return false;
    }
  }

  // 🕐 Zaman bazlı kontrol
  private async checkTimeBased(userId: string, hour: number, operator: string): Promise<boolean> {
    const recentQuizzes = await this.quizProgressModel
      .find({ userId, completedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } })
      .exec();

    return recentQuizzes.some(quiz => {
      const completedHour = new Date(quiz.completedAt).getHours();
      return this.checkCondition(completedHour, hour, operator);
    });
  }

  // 🎖️ Rozet verme
  private async awardBadge(userId: string, badge: any): Promise<void> {
    const userBadge = new this.userBadgeModel({
      userId,
      badgeId: badge._id,
      unlockedAt: new Date(),
      isNew: true,
    });

    await userBadge.save();

    // Kullanıcıya rozet ödülü ver
    if (badge.reward?.xp) {
      await this.userRepository.increment(
        { id: userId },
        'totalXP',
        badge.reward.xp
      );
    }

    this.logger.log(`Awarded badge "${badge.name}" to user ${userId}`);
  }

  // 📊 Rozet istatistikleri
  async getBadgeStats(userId: string): Promise<any> {
    const userBadges = await this.getUserBadges(userId);
    const allBadges = await this.badgeModel.find().exec();

    const stats = {
      total: userBadges.length,
      totalAvailable: allBadges.length,
      completionRate: (userBadges.length / allBadges.length) * 100,
      byRarity: {
        common: userBadges.filter(b => b.rarity === 'common').length,
        uncommon: userBadges.filter(b => b.rarity === 'uncommon').length,
        rare: userBadges.filter(b => b.rarity === 'rare').length,
        epic: userBadges.filter(b => b.rarity === 'epic').length,
        legendary: userBadges.filter(b => b.rarity === 'legendary').length,
      },
      byCategory: {
        welcome: userBadges.filter(b => b.category === 'welcome').length,
        learning: userBadges.filter(b => b.category === 'learning').length,
        perfection: userBadges.filter(b => b.category === 'perfection').length,
        progress: userBadges.filter(b => b.category === 'progress').length,
        coding: userBadges.filter(b => b.category === 'coding').length,
        special: userBadges.filter(b => b.category === 'special').length,
      },
      recentlyEarned: userBadges
        .filter(b => b.isNew)
        .sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime())
        .slice(0, 5),
    };

    return stats;
  }

  // 🎯 Rozet ilerleme takibi
  async getBadgeProgress(userId: string): Promise<any[]> {
    const userBadges = await this.getUserBadges(userId);
    const userBadgeIds = userBadges.map(ub => ub.id);
    const allBadges = await this.badgeModel.find().exec();
    const userStats = await this.getUserStats(userId);

    const progress = allBadges
      .filter(badge => !userBadgeIds.includes(badge.id))
      .map(badge => {
        const progressPercentage = this.calculateBadgeProgress(badge, userStats);
        return {
          ...badge.toObject(),
          progress: progressPercentage,
          isUnlocked: false,
        };
      })
      .sort((a, b) => b.progress - a.progress);

    return progress;
  }

  // 📈 Rozet ilerleme hesaplama
  private calculateBadgeProgress(badge: any, userStats: any): number {
    const condition = badge.condition;
    
    let current = 0;
    let target = condition.value;
    
    switch (condition.type) {
      case 'xp':
        current = userStats.totalXP;
        break;
      case 'quiz_count':
        current = userStats.totalCompletedQuizzes;
        break;
      case 'perfect_score':
        current = userStats.totalPerfectQuizzes;
        break;
      case 'streak':
        current = userStats.currentStreak;
        break;
      case 'question_solver':
        current = userStats.totalSolvedQuestions;
        break;
      case 'project_creator':
        current = userStats.totalCreatedProjects;
        break;
      default:
        return 0;
    }
    
    return Math.min((current / target) * 100, 100);
  }

  // 📊 Kullanıcı istatistikleri al
  private async getUserStats(userId: string): Promise<any> {
    const quizProgress = await this.quizProgressModel.find({ userId }).exec();
    
    return {
      totalXP: quizProgress.reduce((sum, p) => sum + (p.xpEarned || 0), 0),
      totalCompletedQuizzes: quizProgress.filter(p => p.isCompleted).length,
      totalPerfectQuizzes: quizProgress.filter(p => p.isPerfect).length,
      currentStreak: this.calculateStreak(quizProgress),
      totalSolvedQuestions: quizProgress.reduce((sum, p) => sum + (p.correctAnswers || 0), 0),
      totalCreatedProjects: 0, // Bu değer başka bir servisten alınacak
    };
  }

  // 🔥 Seri hesaplama
  private calculateStreak(progress: any[]): number {
    const completed = progress
      .filter(p => p.isCompleted)
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

    let streak = 0;
    for (const quiz of completed) {
      if (quiz.isPerfect) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  // 🎖️ Controller'da eksik metodlar
  
  // Rozetleri eski yap
  async markBadgesAsOld(userId: string): Promise<void> {
    await this.userBadgeModel.updateMany(
      { userId, isNew: true },
      { isNew: false }
    );
  }

  // Belirli bir rozeti manuel olarak ver
  async awardSpecificBadge(userId: string, badgeId: string): Promise<boolean> {
    const badge = await this.badgeModel.findOne({ id: badgeId });
    if (!badge) return false;

    const existingUserBadge = await this.userBadgeModel.findOne({
      userId,
      badgeId: badge._id,
    });

    if (existingUserBadge) return false; // Zaten var

    await this.userBadgeModel.create({
      userId,
      badgeId: badge._id,
      unlockedAt: new Date(),
      isNew: true,
    });

    return true;
  }

  // Default/Modern rozetleri oluştur
  async createDefaultBadges(): Promise<void> {
    return this.createModernBadges();
  }

  // Kullanıcının seviyesine göre açık quizleri getir
  async getAvailableQuizzes(userId: string, allQuizzes: any[]): Promise<any[]> {
    try {
      // Kullanıcının XP'sini hesapla
      const userProgress = await this.quizProgressModel.find({ userId }).exec();
      const totalXP = userProgress.reduce((sum, p) => sum + (p.xpEarned || 0), 0);

      return allQuizzes.filter(quiz => {
        // XP bazlı kilit sistemi
        if (quiz.difficulty === 'easy') return true;
        if (quiz.difficulty === 'medium' && totalXP >= 50) return true;
        if (quiz.difficulty === 'hard' && totalXP >= 100) return true;
        return quiz.difficulty === 'easy'; // Fallback için easy quizleri göster
      });
    } catch (error) {
      this.logger.error('getAvailableQuizzes error:', error);
      return allQuizzes; // Hata durumunda tüm quizleri döndür
    }
  }
} 