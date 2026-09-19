import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import { Quiz, QuizDocument } from '../entities/quiz.entity';
import { QuizProgress, QuizProgressDocument } from '../entities/quiz-progress.entity';
import { User } from '../entities/user.entity';
import { BadgeService } from '../badge/badge.service';

@Injectable()
export class QuizService {
  constructor(
    @InjectModel(Quiz.name) private quizModel: Model<QuizDocument>,
    @InjectModel(QuizProgress.name) private quizProgressModel: Model<QuizProgressDocument>,
    @InjectRepository(User) private userRepository: Repository<User>,
    private badgeService: BadgeService,
  ) {}

  // Tüm aktif quiz'leri getir
  async getAllQuizzes(userId?: string): Promise<Quiz[]> {
    const allQuizzes = await this.quizModel.find({}).exec();
    
    if (userId) {
      // Kullanıcının seviyesine göre quizleri filtrele
      return this.badgeService.getAvailableQuizzes(userId, allQuizzes);
    }
    
    return allQuizzes;
  }

  // Debug: Tüm quiz'leri getir (filtre olmadan)
  async debugAllQuizzes(): Promise<any> {
    const allQuizzes = await this.quizModel.find({}).exec();
    const activeQuizzes = await this.quizModel.find({ isActive: true }).exec();
    const inactiveQuizzes = await this.quizModel.find({ isActive: false }).exec();
    
    return {
      total: allQuizzes.length,
      active: activeQuizzes.length,
      inactive: inactiveQuizzes.length,
      allQuizzes: allQuizzes,
      activeQuizzes: activeQuizzes,
      inactiveQuizzes: inactiveQuizzes
    };
  }

  // Quiz'leri getir
  async getQuizzesBySkill(skillId: string, subjectId: string): Promise<Quiz[]> {
    return this.quizModel.find({ skillId, subjectId, isActive: true }).exec();
  }

  // Quiz detayını getir
  async getQuizById(quizId: string): Promise<Quiz> {
    const quiz = await this.quizModel.findOne({ id: quizId, isActive: true }).exec();
    if (!quiz) {
      throw new NotFoundException('Quiz bulunamadı');
    }
    return quiz;
  }

  // Quiz başlat
  async startQuiz(userId: string, quizId: string): Promise<QuizProgress> {
    const quiz = await this.getQuizById(quizId);
    
    // Mevcut progress'i kontrol et
    let progress = await this.quizProgressModel.findOne({ userId, quizId }).exec();
    
    if (!progress) {
      // Yeni progress oluştur
      progress = new this.quizProgressModel({
        userId,
        quizId,
        skillId: quiz.skillId,
        subjectId: quiz.subjectId,
        totalQuestions: quiz.questions.length,
        totalScore: quiz.questions.reduce((sum, q) => sum + q.points, 0),
        startedAt: new Date(),
      });
    } else {
      // Attempt sayısını artır
      progress.attempts += 1;
      progress.startedAt = new Date();
      progress.isCompleted = false;
      progress.answers = [];
      progress.score = 0;
      progress.correctAnswers = 0;
      progress.timeSpent = 0;
      progress.heartsUsed = 0;
      progress.streak = 0;
    }

    return progress.save();
  }

  // Quiz cevabını kaydet
  async submitAnswer(
    userId: string, 
    quizId: string, 
    questionId: string, 
    userAnswer: string | number,
    timeSpent: number,
    hintsUsed: number = 0
  ): Promise<{ isCorrect: boolean; correctAnswer: string | number; explanation: string }> {
    const quiz = await this.getQuizById(quizId);
    const question = quiz.questions.find(q => q.id === questionId);
    
    if (!question) {
      throw new NotFoundException('Soru bulunamadı');
    }

    const isCorrect = this.checkAnswer(userAnswer, question.correctAnswer);
    
    // Progress'i güncelle
    const progress = await this.quizProgressModel.findOne({ userId, quizId }).exec();
    if (!progress) {
      throw new NotFoundException('Quiz progress bulunamadı');
    }

    // Cevabı kaydet
    const answer = {
      questionId,
      userAnswer,
      correctAnswer: question.correctAnswer,
      isCorrect,
      timeSpent,
      hintsUsed,
    };

    progress.answers.push(answer);
    
    if (isCorrect) {
      progress.correctAnswers += 1;
      progress.score += question.points;
      progress.streak += 1;
    } else {
      progress.streak = 0;
      progress.heartsUsed += 1;
    }

    await progress.save();

    return {
      isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
    };
  }

  // Quiz'i tamamla
  async completeQuiz(userId: string, quizId: string): Promise<QuizProgress> {
    const progress = await this.quizProgressModel.findOne({ userId, quizId }).exec();
    if (!progress) {
      throw new NotFoundException('Quiz progress bulunamadı');
    }

    const quiz = await this.getQuizById(quizId);
    
    progress.isCompleted = true;
    progress.completedAt = new Date();
    progress.isPerfect = progress.correctAnswers === progress.totalQuestions;
    progress.xpEarned = Math.floor((progress.score / progress.totalScore) * quiz.xpReward);

    // 🔥 User entity'sini güncelle
    await this.updateUserStats(userId, progress);

    // Kullanıcı istatistiklerini güncelle ve rozet kontrolü yap
    const userStats = await this.getUserStats(userId);
    const newlyAwarded = await this.badgeService.checkAndAwardBadges(userId, userStats);
    
    // Yeni rozetleri progress'e ekle
    progress.newlyAwardedBadges = newlyAwarded;

    await progress.save();

    // Quiz istatistiklerini güncelle
    await this.quizModel.updateOne(
      { id: quizId },
      { 
        $inc: { totalAttempts: 1 },
        $set: { 
          averageScore: await this.calculateAverageScore(quizId),
          perfectCompletions: await this.calculatePerfectCompletions(quizId)
        }
      }
    );

    return progress;
  }

  // Kullanıcının quiz progress'ini getir
  async getUserQuizProgress(userId: string, skillId?: string): Promise<QuizProgress[]> {
    const filter: any = { userId };
    if (skillId) {
      filter.skillId = skillId;
    }
    return this.quizProgressModel.find(filter).exec();
  }

  // Kullanıcının skill bazında istatistiklerini getir
  async getUserSkillStats(userId: string, skillId: string): Promise<any> {
    const progress = await this.quizProgressModel.find({ userId, skillId }).exec();
    
    const totalQuizzes = progress.length;
    const completedQuizzes = progress.filter(p => p.isCompleted).length;
    const totalXP = progress.reduce((sum, p) => sum + p.xpEarned, 0);
    const averageScore = progress.length > 0 
      ? progress.reduce((sum, p) => sum + (p.score / p.totalScore), 0) / progress.length * 100
      : 0;

    return {
      totalQuizzes,
      completedQuizzes,
      totalXP,
      averageScore,
      progress: progress.map(p => ({
        quizId: p.quizId,
        isCompleted: p.isCompleted,
        score: p.score,
        totalScore: p.totalScore,
        xpEarned: p.xpEarned,
        completedAt: p.completedAt,
      })),
    };
  }

  // Kullanıcının genel istatistiklerini getir
  async getUserStats(userId: string): Promise<any> {
    const progress = await this.quizProgressModel.find({ userId }).exec();
    
    // Bugünkü tarih
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Bugünkü progress
    const todayProgress = progress.filter(p => {
      if (!p.completedAt) return false;
      const completedDate = new Date(p.completedAt);
      completedDate.setHours(0, 0, 0, 0);
      return completedDate.getTime() === today.getTime();
    });
    
    // Bugünkü XP
    const dailyProgress = todayProgress.reduce((sum, p) => sum + p.xpEarned, 0);
    const dailyGoal = 50; // Günlük hedef
    
    // Toplam istatistikler
    const totalXP = progress.reduce((sum, p) => sum + p.xpEarned, 0);
    const totalCompletedQuizzes = progress.filter(p => p.isCompleted).length;
    const totalPerfectQuizzes = progress.filter(p => p.isPerfect).length;
    
    // Seviye hesaplama (her 100 XP = 1 seviye)
    const level = Math.floor(totalXP / 100) + 1;
    const levelProgress = totalXP % 100;
    
    // Seri hesaplama (bugün quiz tamamlandıysa seri devam ediyor)
    const currentStreak = this.calculateCurrentStreak(progress);
    
    // Ortalama skor
    const averageScore = progress.length > 0 
      ? progress.reduce((sum, p) => sum + (p.score / p.totalScore), 0) / progress.length * 100
      : 0;
    
    // Son giriş tarihi
    const lastLoginDate = today.toISOString().split('T')[0];
    
    // Toplam çalışma süresi (tahmini)
    const totalStudyTime = progress.reduce((sum, p) => sum + (p.timeSpent || 0), 0);

    // Toplam çözülen soru sayısı
    const totalSolvedQuestions = progress.reduce((sum, p) => sum + (p.correctAnswers || 0), 0);
    
    return {
      // Günlük ilerleme
      dailyProgress,
      dailyGoal,
      
      // Seri ve seviye
      currentStreak,
      level,
      levelProgress,
      
      // Toplam istatistikler
      totalXP,
      totalCompletedQuizzes,
      totalPerfectQuizzes,
      totalSolvedQuestions,
      averageScore,
      
      // Diğer
      lastLoginDate,
      totalStudyTime,
      hearts: 5, // Varsayılan kalp sayısı
      gems: Math.floor(totalXP / 10), // XP'den gem hesaplama
      
      // Duolingo tarzı özellikler
      streakFreeze: 0,
      doubleXp: false,

      // Proje sayısı (şimdilik 0, ileride başka servisten alınabilir)
      totalCreatedProjects: 0,
    };
  }

  // Seri hesaplama metodu
  private calculateCurrentStreak(progress: QuizProgress[]): number {
    const completedQuizzes = progress
      .filter(p => p.isCompleted && p.completedAt)
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
    
    if (completedQuizzes.length === 0) return 0;
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Bugün quiz tamamlandı mı kontrol et
    const todayCompleted = completedQuizzes.some(p => {
      const completedDate = new Date(p.completedAt);
      completedDate.setHours(0, 0, 0, 0);
      return completedDate.getTime() === today.getTime();
    });
    
    if (!todayCompleted) return 0;
    
    // Geriye doğru seri hesapla
    let currentDate = new Date(today);
    currentDate.setDate(currentDate.getDate() - 1); // Dünden başla
    
    for (let i = 0; i < 365; i++) { // Maksimum 1 yıl geriye git
      const dateCompleted = completedQuizzes.some(p => {
        const completedDate = new Date(p.completedAt);
        completedDate.setHours(0, 0, 0, 0);
        return completedDate.getTime() === currentDate.getTime();
      });
      
      if (dateCompleted) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak + 1; // Bugünü de ekle
  }

  // Yardımcı metodlar
  private checkAnswer(userAnswer: string | number, correctAnswer: string | number): boolean {
    if (typeof userAnswer === 'string' && typeof correctAnswer === 'string') {
      return userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
    }
    return userAnswer === correctAnswer;
  }

  private async calculateAverageScore(quizId: string): Promise<number> {
    const result = await this.quizProgressModel.aggregate([
      { $match: { quizId, isCompleted: true } },
      { $group: { _id: null, avgScore: { $avg: { $divide: ['$score', '$totalScore'] } } } }
    ]);
    return result.length > 0 ? Math.round(result[0].avgScore * 100) : 0;
  }

  private async calculatePerfectCompletions(quizId: string): Promise<number> {
    return this.quizProgressModel.countDocuments({ quizId, isPerfect: true });
  }

  // 🔥 User stats güncelleme metodu
  private async updateUserStats(userId: string, progress: QuizProgress): Promise<void> {
    try {
      if (progress.isCompleted) {
        // User entity'sini güncelle - totalSolvedQuestions artır
        await this.userRepository.update(
          { id: userId },
          {
            totalSolvedQuestions: () => `"totalSolvedQuestions" + ${progress.correctAnswers}`,
          }
        );
      }
    } catch (error) {
      console.error('User stats güncellenirken hata:', error);
      // Hata olsa bile quiz completion devam etsin
    }
  }
} 