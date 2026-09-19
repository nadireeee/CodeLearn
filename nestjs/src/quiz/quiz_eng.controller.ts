import { Controller, Get, Post, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { QuizEngService } from './quiz_eng.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@Controller('quiz-eng')
@UseGuards(JwtAuthGuard)
export class QuizEngController {
  constructor(private readonly quizEngService: QuizEngService) {}

  @Public()
  @Get('all')
  async getAllQuizzes() {
    return this.quizEngService.getAllQuizzes();
  }

  @Get('debug/all')
  async debugAllQuizzes() {
    return this.quizEngService.debugAllQuizzes();
  }

  @Get('skill/:skillId/subject/:subjectId')
  async getQuizzesBySkill(
    @Param('skillId') skillId: string,
    @Param('subjectId') subjectId: string,
  ) {
    return this.quizEngService.getQuizzesBySkill(skillId, subjectId);
  }

  @Get(':quizId')
  async getQuizById(@Param('quizId') quizId: string) {
    return this.quizEngService.getQuizById(quizId);
  }

  @Post(':quizId/start')
  async startQuiz(
    @Request() req,
    @Param('quizId') quizId: string,
  ) {
    return this.quizEngService.startQuiz(req.user.id, quizId);
  }

  @Post(':quizId/answer')
  async submitAnswer(
    @Request() req,
    @Param('quizId') quizId: string,
    @Body() body: {
      questionId: string;
      userAnswer: string | number;
      timeSpent: number;
      hintsUsed?: number;
    },
  ) {
    return this.quizEngService.submitAnswer(
      req.user.id,
      quizId,
      body.questionId,
      body.userAnswer,
      body.timeSpent,
      body.hintsUsed || 0,
    );
  }

  @Post(':quizId/complete')
  async completeQuiz(
    @Request() req,
    @Param('quizId') quizId: string,
  ) {
    return this.quizEngService.completeQuiz(req.user.id, quizId);
  }

  @Get('progress')
  async getUserProgress(
    @Request() req,
    @Query('skillId') skillId?: string,
  ) {
    if (skillId) {
      return this.quizEngService.getUserSkillStats(req.user.id, skillId);
    }
    return this.quizEngService.getUserQuizProgress(req.user.id);
  }

  @Get('progress/')
  async getAllUserProgress(@Request() req) {
    return this.quizEngService.getUserQuizProgress(req.user.id);
  }

  @Get('stats/user')
  async getUserStats(@Request() req) {
    return this.quizEngService.getUserStats(req.user.id);
  }
} 