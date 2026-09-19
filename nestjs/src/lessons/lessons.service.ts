import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chapter } from './entities/chapter.entity';
import { Topic } from './entities/topic.entity';
import { Lesson } from './entities/lesson.entity';
import { ChapterTest } from './entities/chapter-test.entity';
import { UserLessonProgress } from './entities/user-lesson-progress.entity';
import { CompleteLessonDto } from './dto/complete-lesson.dto';
import { SubmitTestDto } from './dto/submit-test.dto';
import { LessonQueryDto } from './dto/lesson-query.dto';
import { User } from '../entities/user.entity';
import { BadgeService } from '../badge/badge.service';
import { LESSON_BADGES } from './badges/lesson-badges.data';

@Injectable()
export class LessonsService {
  constructor(
    @InjectModel('lessons_c_tr') private readonly lessonsCTrModel: Model<any>,
    @InjectModel('lessons_c_en') private readonly lessonsCEnModel: Model<any>,
    @InjectModel('lessons_cpp_tr') private readonly lessonsCppTrModel: Model<any>,
    @InjectModel('lessons_cpp_en') private readonly lessonsCppEnModel: Model<any>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly badgeService: BadgeService,
  ) {}

  private getModel(language: string, locale: string): Model<any> {
    const collectionName = `lessons_${language}_${locale}`;
    switch (collectionName) {
      case 'lessons_c_tr':
        return this.lessonsCTrModel;
      case 'lessons_c_en':
        return this.lessonsCEnModel;
      case 'lessons_cpp_tr':
        return this.lessonsCppTrModel;
      case 'lessons_cpp_en':
        return this.lessonsCppEnModel;
      default:
        throw new Error(`Unsupported collection: ${collectionName}`);
    }
  }

  // Chapter methods
  async getChapters(query: LessonQueryDto) {
    const model = this.getModel(query.language, query.locale);
    console.log('[DEBUG] getChapters - model:', model.collection.collectionName);
    console.log('[DEBUG] getChapters - query:', { language: query.language, locale: query.locale });
    
    const chapters = await model.find({ entityType: 'chapter' }).sort({ order: 1 });
    console.log('[DEBUG] getChapters - chapters count:', chapters.length);
    console.log('[DEBUG] getChapters - chapters:', chapters.map(c => ({ id: c._id, title: c.title, entityType: c.entityType })));
    
    return chapters;
  }

  async getChapter(id: string, query: LessonQueryDto) {
    const model = this.getModel(query.language, query.locale);
    const chapter = await model.findOne({ _id: id, entityType: 'chapter' });
    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }
    return chapter;
  }

  // Topic methods
  async getTopicsByChapter(chapterId: string, query: LessonQueryDto) {
    const model = this.getModel(query.language, query.locale);
    console.log('[DEBUG] getTopicsByChapter - model:', model.collection.collectionName);
    console.log('[DEBUG] getTopicsByChapter - chapterId:', chapterId);
    
    const topics = await model.find({ 
      entityType: 'topic', 
      chapterId 
    }).sort({ order: 1 });
    
    console.log('[DEBUG] getTopicsByChapter - topics count:', topics.length);
    console.log('[DEBUG] getTopicsByChapter - topics:', topics.map(t => ({ id: t._id, title: t.title, chapterId: t.chapterId, entityType: t.entityType })));
    
    return topics;
  }

  async getTopic(id: string, query: LessonQueryDto) {
    const model = this.getModel(query.language, query.locale);
    const topic = await model.findOne({ _id: id, entityType: 'topic' });
    if (!topic) {
      throw new NotFoundException('Topic not found');
    }
    return topic;
  }

  // Lesson methods
  async getLessonsByTopic(topicId: string, query: LessonQueryDto) {
    const model = this.getModel(query.language, query.locale);
    console.log('[DEBUG] getLessonsByTopic - model:', model.collection.collectionName);
    console.log('[DEBUG] getLessonsByTopic - topicId:', topicId);
    
    const lessons = await model.find({ 
      entityType: 'lesson', 
      topicId 
    }).sort({ order: 1 });
    
    console.log('[DEBUG] getLessonsByTopic - lessons count:', lessons.length);
    console.log('[DEBUG] getLessonsByTopic - lessons:', lessons.map(l => ({ id: l._id, title: l.title, topicId: l.topicId, entityType: l.entityType })));
    
    return lessons;
  }

  async getLesson(id: string, query: LessonQueryDto) {
    const model = this.getModel(query.language, query.locale);
    const lesson = await model.findOne({ _id: id, entityType: 'lesson' });
    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }
    return lesson;
  }

  // Test methods
  async getChapterTest(chapterId: string, query: LessonQueryDto) {
    const model = this.getModel(query.language, query.locale);
    const test = await model.findOne({ 
      entityType: 'chapterTest', 
      chapterId 
    });
    if (!test) {
      throw new NotFoundException('Chapter test not found');
    }
    return test;
  }

  // Progress methods
  async getUserProgress(userId: string, query: LessonQueryDto) {
    const model = this.getModel(query.language, query.locale);
    const progress = await model.find({ 
      entityType: 'userLessonProgress', 
      userId 
    });
    return progress;
  }

  async getUserLessonProgress(userId: string, lessonId: string, query: LessonQueryDto) {
    const model = this.getModel(query.language, query.locale);
    const progress = await model.findOne({ 
      entityType: 'userLessonProgress', 
      userId, 
      lessonId 
    });
    return progress;
  }

  async completeLesson(userId: string, dto: CompleteLessonDto) {
    const model = this.getModel(dto.language, dto.locale);
    
    console.log('[DEBUG] completeLesson called with:', { userId, dto });
    console.log('[DEBUG] Using model:', model.collection.collectionName);
    
    // First, let's see what lessons exist in this collection
    const allLessons = await model.find({ entityType: 'lesson' }).limit(5);
    console.log('[DEBUG] Sample lessons in collection:', allLessons.map(l => ({ 
      _id: l._id, 
      id: l.id, 
      title: l.title,
      entityType: l.entityType 
    })));
    
    // Check if lesson exists - try multiple approaches
    let lesson = null;
    
    // Try 1: Direct _id match
    try {
      lesson = await model.findOne({ 
      _id: dto.lessonId, 
      entityType: 'lesson' 
    });
      console.log('[DEBUG] Try 1 (_id):', lesson ? 'Found' : 'Not found');
    } catch (error) {
      console.log('[DEBUG] Try 1 (_id) error:', error.message);
    }
    
    // Try 2: id field match
    if (!lesson) {
      try {
        lesson = await model.findOne({ 
          id: dto.lessonId, 
          entityType: 'lesson' 
        });
        console.log('[DEBUG] Try 2 (id):', lesson ? 'Found' : 'Not found');
      } catch (error) {
        console.log('[DEBUG] Try 2 (id) error:', error.message);
      }
    }
    
    // Try 3: String comparison with _id
    if (!lesson) {
      try {
        lesson = await model.findOne({ 
          $expr: { $eq: [{ $toString: "$_id" }, dto.lessonId] },
          entityType: 'lesson' 
        });
        console.log('[DEBUG] Try 3 (string _id):', lesson ? 'Found' : 'Not found');
      } catch (error) {
        console.log('[DEBUG] Try 3 (string _id) error:', error.message);
      }
    }
    
    if (!lesson) {
      console.error('[DEBUG] Lesson not found after all attempts:', { 
        lessonId: dto.lessonId, 
        lessonIdType: typeof dto.lessonId,
        language: dto.language, 
        locale: dto.locale 
      });
      throw new NotFoundException(`Lesson not found with ID: ${dto.lessonId}`);
    }

    console.log('[DEBUG] Found lesson:', { 
      lessonId: lesson._id, 
      lessonIdString: lesson.id,
      title: lesson.title 
    });

    // Check if already completed
    let progress = await model.findOne({
      entityType: 'userLessonProgress',
      userId,
      lessonId: dto.lessonId
    });

    if (progress && progress.completed) {
      throw new BadRequestException('Lesson already completed');
    }

    // Create or update progress
    if (!progress) {
      progress = {
        entityType: 'userLessonProgress',
        id: `progress_${userId}_${dto.lessonId}`,
        userId,
        lessonId: dto.lessonId,
        topicId: lesson.topicId,
        chapterId: lesson.chapterId,
        language: dto.language,
        locale: dto.locale,
        completed: true,
        completedAt: new Date(),
        passedTests: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        // Add required fields for MongoDB validation
        title: `Progress for ${lesson.title}`,
        description: `User progress for lesson: ${lesson.title}`,
        order: 1,
        totalXp: 0,
        totalTimeSpent: 0,
        currentStreak: 0,
        longestStreak: 0,
        earnedBadges: [],
        newBadges: [],
        testScores: {},
        lessonCompletionTimes: {},
        lessonScores: {},
        favoriteLessons: [],
        lessonNotes: {},
        preferences: {}
      };
      await model.create(progress);
      console.log('[DEBUG] Created new progress record');
    } else {
      await model.updateOne(
        { _id: progress._id },
        { 
          completed: true, 
          completedAt: new Date(),
          updatedAt: new Date()
        }
      );
      console.log('[DEBUG] Updated existing progress record');
    }

    // Update user statistics
    try {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user) {
      user.totalCompletedLessons = (user.totalCompletedLessons || 0) + 1;
      await this.userRepository.save(user);
        console.log('[DEBUG] Updated user statistics');
      }
    } catch (userError) {
      console.error('[DEBUG] Error updating user statistics:', userError);
      // Don't fail the lesson completion if user update fails
    }

    // Check and award badges
    let earnedBadges = [];
    try {
      console.log('[DEBUG] Starting badge check for user:', userId);
      earnedBadges = await this.checkAndAwardBadges(userId, dto.language, dto.locale);
      console.log('[DEBUG] Badge check completed, earned badges:', earnedBadges);
      console.log('[DEBUG] Earned badges length:', earnedBadges.length);
    } catch (badgeError) {
      console.error('[DEBUG] Error checking badges:', badgeError);
      // Don't fail the lesson completion if badge check fails
    }

    console.log('[DEBUG] Lesson completion successful');
    console.log('[DEBUG] Final response with earnedBadges:', { 
      message: 'Lesson completed successfully',
      earnedBadges: earnedBadges
    });
    return { 
      message: 'Lesson completed successfully',
      earnedBadges: earnedBadges
    };
  }

  async submitTest(userId: string, dto: SubmitTestDto) {
    const model = this.getModel(dto.language, dto.locale);
    
    // Check if test exists
    const test = await model.findOne({ 
      _id: dto.testId, 
      entityType: 'chapterTest' 
    });
    if (!test) {
      throw new NotFoundException('Test not found');
    }

    // Calculate score
    const totalQuestions = test.questions.length;
    let correctAnswers = 0;
    
    for (let i = 0; i < dto.answers.length; i++) {
      if (test.questions[i] && test.questions[i].correctAnswer === dto.answers[i]) {
        correctAnswers++;
      }
    }
    
    const score = (correctAnswers / totalQuestions) * 100;
    const passed = score >= test.passingScore;

    // Save test result
    const testResult = {
      entityType: 'userLessonProgress',
      id: `progress_${userId}_test_${dto.testId}`,
      userId,
      testId: dto.testId,
      chapterId: test.chapterId,
      language: dto.language,
      locale: dto.locale,
      score,
      passed,
      answers: dto.answers,
      completedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await model.create(testResult);

    // If passed, update user progress and check badges
    if (passed) {
      // Update user statistics
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (user) {
        user.totalPassedTests = (user.totalPassedTests || 0) + 1;
        await this.userRepository.save(user);
      }

      // Check and award badges
      await this.checkAndAwardBadges(userId, dto.language, dto.locale);
    }

    return {
      score,
      passed,
      correctAnswers,
      totalQuestions,
      message: passed ? 'Test passed successfully!' : 'Test failed. Try again!'
    };
  }

  private async checkAndAwardBadges(userId: string, language: string, locale: string): Promise<any[]> {
    const model = this.getModel(language, locale);
    const userProgress = await model.find({ 
      entityType: 'userLessonProgress', 
      userId 
    });

    const earnedBadges = [];

    // Check milestone badges
    const milestoneBadges = await this.checkMilestoneBadges(userId, userProgress);
    earnedBadges.push(...milestoneBadges);
    
    // Check achievement badges
    const achievementBadges = await this.checkAchievementBadges(userId, userProgress);
    earnedBadges.push(...achievementBadges);
    
    // Check mastery badges
    const masteryBadges = await this.checkMasteryBadges(userId, userProgress, language, locale);
    earnedBadges.push(...masteryBadges);

    return earnedBadges;
  }

  private async checkMilestoneBadges(userId: string, userProgress: any[]): Promise<any[]> {
    const completedLessons = userProgress.filter(p => p.completed && p.lessonId);
    const passedTests = userProgress.filter(p => p.passed && p.testId);

    console.log('[DEBUG] checkMilestoneBadges - completedLessons count:', completedLessons.length);
    console.log('[DEBUG] checkMilestoneBadges - passedTests count:', passedTests.length);

    const earnedBadges = [];

    // İlk Adım - First lesson entry
    if (completedLessons.length >= 1) {
      console.log('[DEBUG] Attempting to award ilk_adim badge');
      const badge = await this.awardBadgeIfNotExists(userId, 'ilk_adim');
      if (badge) {
        console.log('[DEBUG] Successfully awarded ilk_adim badge:', badge);
        earnedBadges.push(badge);
      } else {
        console.log('[DEBUG] ilk_adim badge already exists or failed to award');
      }
    }

    // İlk Dersim - First lesson complete
    if (completedLessons.length >= 1) {
      console.log('[DEBUG] Attempting to award ilk_dersim badge');
      const badge = await this.awardBadgeIfNotExists(userId, 'ilk_dersim');
      if (badge) {
        console.log('[DEBUG] Successfully awarded ilk_dersim badge:', badge);
        earnedBadges.push(badge);
      } else {
        console.log('[DEBUG] ilk_dersim badge already exists or failed to award');
      }
    }

    // İlk Testim - First test
    if (passedTests.length >= 1) {
      console.log('[DEBUG] Attempting to award ilk_testim badge');
      const badge = await this.awardBadgeIfNotExists(userId, 'ilk_testim');
      if (badge) {
        console.log('[DEBUG] Successfully awarded ilk_testim badge:', badge);
        earnedBadges.push(badge);
      } else {
        console.log('[DEBUG] ilk_testim badge already exists or failed to award');
      }
    }

    console.log('[DEBUG] checkMilestoneBadges - total earned badges:', earnedBadges.length);
    return earnedBadges;
  }

  private async checkAchievementBadges(userId: string, userProgress: any[]): Promise<any[]> {
    const completedLessons = userProgress.filter(p => p.completed && p.lessonId);
    const passedTests = userProgress.filter(p => p.passed && p.testId);

    const earnedBadges = [];

    // Lesson milestone badges
    if (completedLessons.length >= 5) {
      const badge = await this.awardBadgeIfNotExists(userId, 'lesson_explorer');
      if (badge) earnedBadges.push(badge);
    }
    if (completedLessons.length >= 10) {
      const badge = await this.awardBadgeIfNotExists(userId, 'lesson_enthusiast');
      if (badge) earnedBadges.push(badge);
    }
    if (completedLessons.length >= 25) {
      const badge = await this.awardBadgeIfNotExists(userId, 'lesson_champion');
      if (badge) earnedBadges.push(badge);
    }

    // Test milestone badges
    if (passedTests.length >= 3) {
      const badge = await this.awardBadgeIfNotExists(userId, 'test_taker');
      if (badge) earnedBadges.push(badge);
    }
    if (passedTests.length >= 5) {
      const badge = await this.awardBadgeIfNotExists(userId, 'test_master');
      if (badge) earnedBadges.push(badge);
    }

    return earnedBadges;
  }

  private async checkMasteryBadges(userId: string, userProgress: any[], language: string, locale: string): Promise<any[]> {
    const model = this.getModel(language, locale);
    
    // Get all chapters
    const chapters = await model.find({ entityType: 'chapter' });
    
    const earnedBadges = [];

    // Check if user completed all lessons in a chapter
    for (const chapter of chapters) {
      const chapterLessons = await model.find({ 
        entityType: 'lesson', 
        chapterId: chapter._id 
      });
      
      const completedChapterLessons = userProgress.filter(p => 
        p.completed && 
        p.lessonId && 
        chapterLessons.some(l => l._id.toString() === p.lessonId)
      );
      
      if (completedChapterLessons.length === chapterLessons.length && chapterLessons.length > 0) {
        const badgeKey = `chapter_${chapter.id}_master`;
        const badge = await this.awardBadgeIfNotExists(userId, badgeKey);
        if (badge) earnedBadges.push(badge);
      }
    }

    return earnedBadges;
  }

  private async awardBadgeIfNotExists(userId: string, badgeKey: string): Promise<any | null> {
    try {
      // Check if user already has this badge
      const userBadges = await this.badgeService.getUserBadges(userId);
      const existingBadge = userBadges.find(badge => badge.id === badgeKey);
      if (existingBadge) {
        return null; // Badge already exists
      }

      // Award the badge
      const awarded = await this.badgeService.awardSpecificBadge(userId, badgeKey);
      if (awarded) {
        console.log(`[DEBUG] Awarded badge ${badgeKey} to user ${userId}`);
        // Return badge data for notification
        return {
          id: badgeKey,
          name: this.getBadgeName(badgeKey, 'tr'),
          nameEn: this.getBadgeName(badgeKey, 'en'),
          description: this.getBadgeDescription(badgeKey, 'tr'),
          descriptionEn: this.getBadgeDescription(badgeKey, 'en'),
          icon: this.getBadgeIcon(badgeKey),
          color: this.getBadgeColor(badgeKey),
          rarity: this.getBadgeRarity(badgeKey)
        };
      }
      return null;
    } catch (error) {
      console.error(`[DEBUG] Error awarding badge ${badgeKey}:`, error);
      return null;
    }
  }

  private getBadgeName(badgeKey: string, locale: 'tr' | 'en'): string {
    const badgeNames: { [key: string]: { tr: string; en: string } } = {
      'ilk_adim': { tr: 'İlk Adım', en: 'First Step' },
      'ilk_dersim': { tr: 'İlk Dersim', en: 'My First Lesson' },
      'ilk_testim': { tr: 'İlk Testim', en: 'My First Test' },
      'lesson_explorer': { tr: 'Ders Kaşifi', en: 'Lesson Explorer' },
      'lesson_enthusiast': { tr: 'Ders Tutkunu', en: 'Lesson Enthusiast' },
      'lesson_champion': { tr: 'Ders Şampiyonu', en: 'Lesson Champion' },
      'test_taker': { tr: 'Test Çözücü', en: 'Test Taker' },
      'test_master': { tr: 'Test Ustası', en: 'Test Master' },
    };
    return badgeNames[badgeKey]?.[locale] || badgeKey;
  }

  private getBadgeDescription(badgeKey: string, locale: 'tr' | 'en'): string {
    const badgeDescriptions: { [key: string]: { tr: string; en: string } } = {
      'ilk_adim': { tr: 'İlk derse giriş yaptın!', en: 'You entered your first lesson!' },
      'ilk_dersim': { tr: 'İlk dersini başarıyla tamamladın!', en: 'Successfully completed your first lesson!' },
      'ilk_testim': { tr: 'İlk bölüm testini başarıyla geçtin!', en: 'Successfully passed your first chapter test!' },
      'lesson_explorer': { tr: '5 ders tamamladın!', en: 'Completed 5 lessons!' },
      'lesson_enthusiast': { tr: '10 ders tamamladın!', en: 'Completed 10 lessons!' },
      'lesson_champion': { tr: '25 ders tamamladın!', en: 'Completed 25 lessons!' },
      'test_taker': { tr: '3 test geçtin!', en: 'Passed 3 tests!' },
      'test_master': { tr: '5 test geçtin!', en: 'Passed 5 tests!' },
    };
    return badgeDescriptions[badgeKey]?.[locale] || '';
  }

  private getBadgeIcon(badgeKey: string): string {
    const badgeIcons: { [key: string]: string } = {
      'ilk_adim': '🥉',
      'ilk_dersim': '🥈',
      'ilk_testim': '🥇',
      'lesson_explorer': '📚',
      'lesson_enthusiast': '🎓',
      'lesson_champion': '👨‍🎓',
      'test_taker': '✅',
      'test_master': '🏆',
    };
    return badgeIcons[badgeKey] || '🏅';
  }

  private getBadgeColor(badgeKey: string): string {
    const badgeColors: { [key: string]: string } = {
      'ilk_adim': '#CD7F32',
      'ilk_dersim': '#C0C0C0',
      'ilk_testim': '#FFD700',
      'lesson_explorer': '#10B981',
      'lesson_enthusiast': '#7C3AED',
      'lesson_champion': '#1F2937',
      'test_taker': '#3B82F6',
      'test_master': '#8B5CF6',
    };
    return badgeColors[badgeKey] || '#6B7280';
  }

  private getBadgeRarity(badgeKey: string): string {
    const badgeRarities: { [key: string]: string } = {
      'ilk_adim': 'common',
      'ilk_dersim': 'uncommon',
      'ilk_testim': 'rare',
      'lesson_explorer': 'uncommon',
      'lesson_enthusiast': 'rare',
      'lesson_champion': 'epic',
      'test_taker': 'uncommon',
      'test_master': 'rare',
    };
    return badgeRarities[badgeKey] || 'common';
  }

  // Statistics methods
  async getUserStatistics(userId: string, query: LessonQueryDto) {
    const model = this.getModel(query.language, query.locale);
    const userProgress = await model.find({ 
      entityType: 'userLessonProgress', 
      userId 
    });

    const completedLessons = userProgress.filter(p => p.completed && p.lessonId);
    const passedTests = userProgress.filter(p => p.passed && p.testId);
    
    // Get total counts
    const totalLessons = await model.countDocuments({ entityType: 'lesson' });
    const totalTests = await model.countDocuments({ entityType: 'chapterTest' });

    return {
      completedLessons: completedLessons.length,
      totalLessons,
      passedTests: passedTests.length,
      totalTests,
      progressPercentage: totalLessons > 0 ? (completedLessons.length / totalLessons) * 100 : 0,
      testSuccessRate: totalTests > 0 ? (passedTests.length / totalTests) * 100 : 0
    };
  }

  // Learning path methods
  async getNextLesson(userId: string, query: LessonQueryDto) {
    const model = this.getModel(query.language, query.locale);
    const userProgress = await model.find({ 
      entityType: 'userLessonProgress', 
      userId,
      completed: true
    });

    const completedLessonIds = userProgress
      .filter(p => p.lessonId)
      .map(p => p.lessonId);

    // Find next incomplete lesson
    const allLessons = await model.find({ entityType: 'lesson' })
      .sort({ chapterId: 1, topicId: 1, order: 1 });

    const nextLesson = allLessons.find(lesson => 
      !completedLessonIds.includes(lesson._id.toString())
    );

    return nextLesson || null;
  }

  async canAccessLesson(userId: string, lessonId: string, query: LessonQueryDto): Promise<boolean> {
    const model = this.getModel(query.language, query.locale);
    
    // Get the lesson
    const lesson = await model.findOne({ _id: lessonId, entityType: 'lesson' });
    if (!lesson) {
      return false;
    }

    // Get all lessons in the same topic, ordered
    const topicLessons = await model.find({ 
      entityType: 'lesson', 
      topicId: lesson.topicId 
    }).sort({ order: 1 });

    // Find the lesson's position
    const lessonIndex = topicLessons.findIndex(l => l._id.toString() === lessonId);
    if (lessonIndex === 0) {
      return true; // First lesson is always accessible
    }

    // Check if previous lesson is completed
    const previousLesson = topicLessons[lessonIndex - 1];
    const previousProgress = await model.findOne({
      entityType: 'userLessonProgress',
      userId,
      lessonId: previousLesson._id.toString(),
      completed: true
    });

    return !!previousProgress;
  }
} 