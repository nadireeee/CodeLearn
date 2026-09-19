import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import { QuizEng, QuizEngDocument } from '../entities/quiz-eng.entity';
import { QuizProgress, QuizProgressDocument } from '../entities/quiz-progress.entity';
import { User } from '../entities/user.entity';
import { BadgeService } from '../badge/badge.service';

@Injectable()
export class QuizEngService {
  constructor(
    @InjectModel(QuizEng.name) private quizEngModel: Model<QuizEngDocument>,
    @InjectModel(QuizProgress.name) private quizProgressModel: Model<QuizProgressDocument>,
    @InjectRepository(User) private userRepository: Repository<User>,
    private badgeService: BadgeService,
  ) {}

  // Get all English quizzes
  async getAllQuizzes(): Promise<QuizEng[]> {
    console.log('🔍 DEBUG: getAllQuizzes (English) called');
    
    const allQuizzes = await this.quizEngModel.find({}).exec();
    console.log('🔍 DEBUG: Found', allQuizzes.length, 'English quizzes in database');
    
    return allQuizzes;
  }

  // Debug: Get all English quizzes (without filter)
  async debugAllQuizzes(): Promise<any> {
    const allQuizzes = await this.quizEngModel.find({}).exec();
    const activeQuizzes = await this.quizEngModel.find({ isActive: true }).exec();
    const inactiveQuizzes = await this.quizEngModel.find({ isActive: false }).exec();
    
    return {
      total: allQuizzes.length,
      active: activeQuizzes.length,
      inactive: inactiveQuizzes.length,
      allQuizzes: allQuizzes,
      activeQuizzes: activeQuizzes,
      inactiveQuizzes: inactiveQuizzes,
    };
  }

  // Get English quizzes by skill
  async getQuizzesBySkill(skillId: string, subjectId: string): Promise<QuizEng[]> {
    return this.quizEngModel.find({ skillId, subjectId, isActive: true }).exec();
  }

  // Get English quiz by ID
  async getQuizById(quizId: string): Promise<QuizEng> {
    const quiz = await this.quizEngModel.findOne({ id: quizId, isActive: true }).exec();
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }
    return quiz;
  }

  // Start English quiz
  async startQuiz(userId: string, quizId: string): Promise<QuizProgress> {
    const quiz = await this.getQuizById(quizId);
    
    // Check existing progress
    let progress = await this.quizProgressModel.findOne({ userId, quizId }).exec();
    
    if (!progress) {
      // Create new progress
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
      // Increment attempts
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

  // Submit answer for English quiz
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
      throw new NotFoundException('Question not found');
    }

    const isCorrect = this.checkAnswer(userAnswer, question.correctAnswer);
    
    // Update progress
    const progress = await this.quizProgressModel.findOne({ userId, quizId }).exec();
    if (!progress) {
      throw new NotFoundException('Quiz progress not found');
    }

    // Save answer
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

  // Complete English quiz
  async completeQuiz(userId: string, quizId: string): Promise<any> {
    const progress = await this.quizProgressModel.findOne({ userId, quizId }).exec();
    if (!progress) {
      throw new NotFoundException('Quiz progress not found');
    }

    const quiz = await this.getQuizById(quizId);
    
    progress.isCompleted = true;
    progress.completedAt = new Date();
    progress.isPerfect = progress.correctAnswers === progress.totalQuestions;
    progress.xpEarned = Math.floor((progress.score / progress.totalScore) * quiz.xpReward);

    // User entity'sini güncelle
    await this.updateUserStats(userId, progress);

    // Kullanıcı istatistiklerini güncelle ve rozet kontrolü yap
    const userStats = await this.getUserStats(userId);
    const newlyAwarded = await this.badgeService.checkAndAwardBadges(userId, userStats);
    
    // Yeni rozetleri progress'e ekle
    progress.newlyAwardedBadges = newlyAwarded;

    await progress.save();

    // Quiz istatistiklerini güncelle
    await this.quizEngModel.updateOne(
      { id: quizId },
      { 
        $inc: { totalAttempts: 1 },
        $set: { 
          averageScore: await this.calculateAverageScore(quizId),
          perfectCompletions: await this.calculatePerfectCompletions(quizId)
        }
      }
    );

    return {
      progress,
      newlyAwardedBadges: newlyAwarded,
    };
  }

  // Get user quiz progress
  async getUserQuizProgress(userId: string, skillId?: string): Promise<QuizProgress[]> {
    const filter: any = { userId };
    if (skillId) {
      filter.skillId = skillId;
    }
    return this.quizProgressModel.find(filter).exec();
  }

  // Get user skill stats
  async getUserSkillStats(userId: string, skillId: string): Promise<any> {
    const progress = await this.quizProgressModel.find({ userId, skillId }).exec();
    
    const totalQuizzes = progress.length;
    const completedQuizzes = progress.filter(p => p.isCompleted).length;
    const totalXP = progress.reduce((sum, p) => sum + p.xpEarned, 0);
    const averageScore = progress.length > 0 
      ? progress.reduce((sum, p) => sum + (p.score / p.totalScore), 0) / progress.length * 100
      : 0;
    const perfectQuizzes = progress.filter(p => p.isPerfect).length;
    const currentStreak = this.calculateCurrentStreak(progress);

    return {
      skillId,
      totalQuizzes,
      completedQuizzes,
      totalXP,
      averageScore: Math.round(averageScore),
      perfectQuizzes,
      currentStreak,
      progress: progress.map(p => ({
        quizId: p.quizId,
        isCompleted: p.isCompleted,
        score: p.score,
        totalScore: p.totalScore,
        correctAnswers: p.correctAnswers,
        totalQuestions: p.totalQuestions,
        xpEarned: p.xpEarned,
        isPerfect: p.isPerfect,
        completedAt: p.completedAt,
      }))
    };
  }

  // Get user stats
  async getUserStats(userId: string): Promise<any> {
    const progress = await this.quizProgressModel.find({ userId }).exec();
    
    const totalQuizzes = progress.length;
    const completedQuizzes = progress.filter(p => p.isCompleted).length;
    const totalXP = progress.reduce((sum, p) => sum + p.xpEarned, 0);
    const averageScore = progress.length > 0 
      ? progress.reduce((sum, p) => sum + (p.score / p.totalScore), 0) / progress.length * 100
      : 0;
    const perfectQuizzes = progress.filter(p => p.isPerfect).length;
    const currentStreak = this.calculateCurrentStreak(progress);

    // Group by skill
    const skillStats = {};
    progress.forEach(p => {
      if (!skillStats[p.skillId]) {
        skillStats[p.skillId] = {
          totalQuizzes: 0,
          completedQuizzes: 0,
          totalXP: 0,
          perfectQuizzes: 0,
        };
      }
      skillStats[p.skillId].totalQuizzes += 1;
      if (p.isCompleted) {
        skillStats[p.skillId].completedQuizzes += 1;
        skillStats[p.skillId].totalXP += p.xpEarned;
        if (p.isPerfect) {
          skillStats[p.skillId].perfectQuizzes += 1;
        }
      }
    });

    // Toplam çözülen soru sayısı
    const totalSolvedQuestions = progress.reduce((sum, p) => sum + (p.correctAnswers || 0), 0);

    return {
      totalQuizzes,
      completedQuizzes,
      totalXP,
      averageScore: Math.round(averageScore),
      perfectQuizzes,
      totalPerfectQuizzes: perfectQuizzes, // Badge service için alias
      totalCompletedQuizzes: completedQuizzes, // Badge service için alias
      totalSolvedQuestions,
      currentStreak,
      skillStats,
      
      // Proje sayısı (şimdilik 0, ileride başka servisten alınabilir)
      totalCreatedProjects: 0,
      
      recentProgress: progress
        .filter(p => p.isCompleted)
        .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
        .slice(0, 10)
        .map(p => ({
          quizId: p.quizId,
          score: p.score,
          totalScore: p.totalScore,
          xpEarned: p.xpEarned,
          isPerfect: p.isPerfect,
          completedAt: p.completedAt,
        }))
    };
  }

  // Calculate current streak
  private calculateCurrentStreak(progress: QuizProgress[]): number {
    const completedQuizzes = progress
      .filter(p => p.isCompleted)
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

    let streak = 0;
    for (const quiz of completedQuizzes) {
      if (quiz.isPerfect) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  // Check if answer is correct
  private checkAnswer(userAnswer: string | number, correctAnswer: string | number): boolean {
    return String(userAnswer).toLowerCase() === String(correctAnswer).toLowerCase();
  }

  // Calculate average score for a quiz
  private async calculateAverageScore(quizId: string): Promise<number> {
    const progress = await this.quizProgressModel.find({ quizId, isCompleted: true }).exec();
    if (progress.length === 0) return 0;
    
    const totalScore = progress.reduce((sum, p) => sum + (p.score / p.totalScore), 0);
    return Math.round((totalScore / progress.length) * 100);
  }

  // Calculate perfect completions for a quiz
  private async calculatePerfectCompletions(quizId: string): Promise<number> {
    return this.quizProgressModel.countDocuments({ quizId, isCompleted: true, isPerfect: true }).exec();
  }

  // User stats güncelleme metodu
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