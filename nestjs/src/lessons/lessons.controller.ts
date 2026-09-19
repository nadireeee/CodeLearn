import { 
  Controller, 
  Get, 
  Post, 
  Param, 
  Query, 
  Body, 
  UseGuards, 
  ParseIntPipe,
  BadRequestException 
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { LessonsService } from './lessons.service';
import { CompleteLessonDto } from './dto/complete-lesson.dto';
import { SubmitTestDto } from './dto/submit-test.dto';
import { LessonQueryDto } from './dto/lesson-query.dto';

@Controller('lessons')
@UseGuards(JwtAuthGuard)
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  // Chapter endpoints
  @Get('chapters')
  async getChapters(@Query() query: LessonQueryDto) {
    this.validateQuery(query);
    return this.lessonsService.getChapters(query);
  }

  @Get('chapters/:id')
  async getChapter(
    @Param('id') id: string,
    @Query() query: LessonQueryDto
  ) {
    this.validateQuery(query);
    return this.lessonsService.getChapter(id, query);
  }

  @Get('chapters/:chapterId/topics')
  async getTopicsByChapter(
    @Param('chapterId') chapterId: string,
    @Query() query: LessonQueryDto
  ) {
    this.validateQuery(query);
    return this.lessonsService.getTopicsByChapter(chapterId, query);
  }

  @Get('chapters/:chapterId/test')
  async getChapterTest(
    @Param('chapterId') chapterId: string,
    @Query() query: LessonQueryDto
  ) {
    this.validateQuery(query);
    return this.lessonsService.getChapterTest(chapterId, query);
  }

  // Topic endpoints
  @Get('topics/:id')
  async getTopic(
    @Param('id') id: string,
    @Query() query: LessonQueryDto
  ) {
    this.validateQuery(query);
    return this.lessonsService.getTopic(id, query);
  }

  @Get('topics/:topicId/lessons')
  async getLessonsByTopic(
    @Param('topicId') topicId: string,
    @Query() query: LessonQueryDto
  ) {
    this.validateQuery(query);
    return this.lessonsService.getLessonsByTopic(topicId, query);
  }

  // Lesson endpoints
  @Get('lessons/:id')
  async getLesson(
    @Param('id') id: string,
    @Query() query: LessonQueryDto
  ) {
    this.validateQuery(query);
    return this.lessonsService.getLesson(id, query);
  }

  @Get('lessons/:id/can-access')
  async canAccessLesson(
    @Param('id') id: string,
    @Query() query: LessonQueryDto
    // @CurrentUser() user: any // Geçici olarak devre dışı
  ) {
    this.validateQuery(query);
    return {
      canAccess: true // Geçici olarak true döndür
    };
  }

  @Post('lessons/complete')
  async completeLesson(
    @Body() dto: CompleteLessonDto,
    @CurrentUser() user: any
  ) {
    return this.lessonsService.completeLesson(user.id, dto);
  }

  // Test endpoints
  @Post('tests/submit')
  async submitTest(
    @Body() dto: SubmitTestDto
    // @CurrentUser() user: any // Geçici olarak devre dışı
  ) {
    return this.lessonsService.submitTest('test-user-id', dto);
  }

  // Progress endpoints
  @Get('progress')
  async getUserProgress(
    @Query() query: LessonQueryDto,
    @CurrentUser() user: any
  ) {
    this.validateQuery(query);
    return this.lessonsService.getUserProgress(user.id, query);
  }

  @Get('progress/lessons/:lessonId')
  async getUserLessonProgress(
    @Param('lessonId') lessonId: string,
    @Query() query: LessonQueryDto
    // @CurrentUser() user: any // Geçici olarak devre dışı
  ) {
    this.validateQuery(query);
    return this.lessonsService.getUserLessonProgress('test-user-id', lessonId, query);
  }

  @Get('progress/statistics')
  async getUserStatistics(
    @Query() query: LessonQueryDto
    // @CurrentUser() user: any // Geçici olarak devre dışı
  ) {
    this.validateQuery(query);
    return this.lessonsService.getUserStatistics('test-user-id', query);
  }

  @Get('progress/next-lesson')
  async getNextLesson(
    @Query() query: LessonQueryDto
    // @CurrentUser() user: any // Geçici olarak devre dışı
  ) {
    this.validateQuery(query);
    return this.lessonsService.getNextLesson('test-user-id', query);
  }

  // Learning path endpoints
  @Get('learning-path')
  async getLearningPath(
    @Query() query: LessonQueryDto
    // @CurrentUser() user: any // Geçici olarak devre dışı
  ) {
    this.validateQuery(query);
    
    // Get user progress and next lesson
    const [progress, nextLesson, statistics] = await Promise.all([
      this.lessonsService.getUserProgress('test-user-id', query),
      this.lessonsService.getNextLesson('test-user-id', query),
      this.lessonsService.getUserStatistics('test-user-id', query)
    ]);

    return {
      progress,
      nextLesson,
      statistics,
      hasNextLesson: !!nextLesson
    };
  }

  // Admin endpoints (for seeding and management)
  @Get('admin/collections')
  async getCollections() {
    return {
      collections: [
        'lessons_c_tr',
        'lessons_c_en', 
        'lessons_cpp_tr',
        'lessons_cpp_en'
      ]
    };
  }

  @Get('admin/collection-stats')
  async getCollectionStats(@Query() query: LessonQueryDto) {
    this.validateQuery(query);
    
    const [chapters, topics, lessons, tests] = await Promise.all([
      this.lessonsService.getChapters(query),
      this.lessonsService.getTopicsByChapter('', query).catch(() => []),
      this.lessonsService.getLessonsByTopic('', query).catch(() => []),
      this.lessonsService.getChapterTest('', query).catch(() => null)
    ]);

    return {
      language: query.language,
      locale: query.locale,
      stats: {
        chapters: chapters.length,
        topics: topics.length,
        lessons: lessons.length,
        tests: tests ? 1 : 0
      }
    };
  }

  // Utility methods
  private validateQuery(query: LessonQueryDto) {
    const validLanguages = ['c', 'cpp'];
    const validLocales = ['tr', 'en'];

    if (!validLanguages.includes(query.language)) {
      throw new BadRequestException(`Invalid language. Must be one of: ${validLanguages.join(', ')}`);
    }

    if (!validLocales.includes(query.locale)) {
      throw new BadRequestException(`Invalid locale. Must be one of: ${validLocales.join(', ')}`);
    }
  }

  // Batch operations for better performance
  @Get('batch/chapters-with-topics')
  async getChaptersWithTopics(@Query() query: LessonQueryDto) {
    this.validateQuery(query);
    
    const chapters = await this.lessonsService.getChapters(query);
    const chaptersWithTopics = await Promise.all(
      chapters.map(async (chapter) => {
        const topics = await this.lessonsService.getTopicsByChapter(chapter._id, query);
        return {
          ...chapter,
          topics
        };
      })
    );

    return chaptersWithTopics;
  }

  @Get('batch/topics-with-lessons')
  async getTopicsWithLessons(
    @Query('chapterId') chapterId: string,
    @Query() query: LessonQueryDto
  ) {
    this.validateQuery(query);
    
    if (!chapterId) {
      throw new BadRequestException('chapterId is required');
    }

    const topics = await this.lessonsService.getTopicsByChapter(chapterId, query);
    const topicsWithLessons = await Promise.all(
      topics.map(async (topic) => {
        const lessons = await this.lessonsService.getLessonsByTopic(topic._id, query);
        return {
          ...topic,
          lessons
        };
      })
    );

    return topicsWithLessons;
  }

  @Get('batch/user-progress-summary')
  async getUserProgressSummary(
    @Query() query: LessonQueryDto,
    @CurrentUser() user: any
  ) {
    this.validateQuery(query);
    
    const [
      chapters,
      userProgress,
      statistics,
      nextLesson
    ] = await Promise.all([
      this.lessonsService.getChapters(query),
      this.lessonsService.getUserProgress(user.id, query),
      this.lessonsService.getUserStatistics(user.id, query),
      this.lessonsService.getNextLesson(user.id, query)
    ]);

    // Group progress by chapter
    const progressByChapter = {};
    userProgress.forEach(progress => {
      if (!progressByChapter[progress.chapterId]) {
        progressByChapter[progress.chapterId] = {
          completedLessons: 0,
          passedTests: 0
        };
      }
      
      if (progress.completed && progress.lessonId) {
        progressByChapter[progress.chapterId].completedLessons++;
      }
      
      if (progress.passed && progress.testId) {
        progressByChapter[progress.chapterId].passedTests++;
      }
    });

    return {
      chapters: chapters.map(chapter => ({
        ...chapter,
        progress: progressByChapter[chapter._id] || { completedLessons: 0, passedTests: 0 }
      })),
      statistics,
      nextLesson,
      totalProgress: userProgress.length
    };
  }
} 