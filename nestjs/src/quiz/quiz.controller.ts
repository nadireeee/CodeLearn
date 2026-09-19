import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@Controller('quiz')
@UseGuards(JwtAuthGuard)
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Public()
  @Get('all')
  async getAllQuizzes(@Request() req) {
    return this.quizService.getAllQuizzes(req.user?.id);
  }

  @Get('debug/all')
  async debugAllQuizzes() {
    return this.quizService.debugAllQuizzes();
  }

  @Get('skill/:skillId/subject/:subjectId')
  async getQuizzesBySkill(
    @Param('skillId') skillId: string,
    @Param('subjectId') subjectId: string,
  ) {
    return this.quizService.getQuizzesBySkill(skillId, subjectId);
  }

  @Get(':quizId')
  async getQuizById(@Param('quizId') quizId: string) {
    return this.quizService.getQuizById(quizId);
  }

  @Post(':quizId/start')
  async startQuiz(
    @Request() req,
    @Param('quizId') quizId: string,
  ) {
    return this.quizService.startQuiz(req.user.id, quizId);
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
    return this.quizService.submitAnswer(
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
    return this.quizService.completeQuiz(req.user.id, quizId);
  }

  @Get('user/progress')
  async getUserProgress(@Request() req) {
    return this.quizService.getUserQuizProgress(req.user.id);
  }

  @Get('user/progress/:skillId')
  async getUserSkillStats(
    @Request() req,
    @Param('skillId') skillId: string,
  ) {
    return this.quizService.getUserSkillStats(req.user.id, skillId);
  }

  @Get('stats/user')
  async getUserStats(@Request() req) {
    return this.quizService.getUserStats(req.user.id);
  }
} 