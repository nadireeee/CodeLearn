import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ForumService } from './forum.service';
import {
  CreateQuestionDto,
  UpdateQuestionDto,
  CreateAnswerDto,
  UpdateAnswerDto,
  CreateCommentDto,
  VoteDto,
  GetQuestionsQueryDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { User } from '../entities/user.entity';

@Controller('forum')
export class ForumController {
  constructor(private readonly forumService: ForumService) {}

  // Question endpoints
  @Post('questions')
  @UseGuards(JwtAuthGuard)
  async createQuestion(
    @Body() createQuestionDto: CreateQuestionDto,
    @Request() req: { user: User }
  ) {
    return this.forumService.createQuestion(createQuestionDto, req.user);
  }

  @Get('questions')
  async getQuestions(@Query() query: GetQuestionsQueryDto) {
    return this.forumService.getQuestions(query);
  }

  @Get('questions/:id')
  async getQuestionById(@Param('id') id: string) {
    return this.forumService.getQuestionById(id);
  }

  @Put('questions/:id')
  @UseGuards(JwtAuthGuard)
  async updateQuestion(
    @Param('id') id: string,
    @Body() updateQuestionDto: UpdateQuestionDto,
    @Request() req: { user: User }
  ) {
    return this.forumService.updateQuestion(id, updateQuestionDto, req.user);
  }

  @Delete('questions/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteQuestion(
    @Param('id') id: string,
    @Request() req: { user: User }
  ) {
    await this.forumService.deleteQuestion(id, req.user);
  }

  // Answer endpoints
  @Post('questions/:id/answers')
  @UseGuards(JwtAuthGuard)
  async createAnswer(
    @Param('id') questionId: string,
    @Body() createAnswerDto: CreateAnswerDto,
    @Request() req: { user: User }
  ) {
    return this.forumService.createAnswer(questionId, createAnswerDto, req.user);
  }

  @Put('answers/:id')
  @UseGuards(JwtAuthGuard)
  async updateAnswer(
    @Param('id') id: string,
    @Body() updateAnswerDto: UpdateAnswerDto,
    @Request() req: { user: User }
  ) {
    return this.forumService.updateAnswer(id, updateAnswerDto, req.user);
  }

  @Delete('answers/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAnswer(
    @Param('id') id: string,
    @Request() req: { user: User }
  ) {
    await this.forumService.deleteAnswer(id, req.user);
  }

  // Comment endpoints
  @Post('questions/:id/comments')
  @UseGuards(JwtAuthGuard)
  async createQuestionComment(
    @Param('id') questionId: string,
    @Body() createCommentDto: CreateCommentDto,
    @Request() req: { user: User }
  ) {
    return this.forumService.createComment(questionId, createCommentDto, req.user);
  }

  @Post('answers/:id/comments')
  @UseGuards(JwtAuthGuard)
  async createAnswerComment(
    @Param('id') answerId: string,
    @Body() createCommentDto: CreateCommentDto,
    @Request() req: { user: User }
  ) {
    return this.forumService.createAnswerComment(answerId, createCommentDto, req.user);
  }

  // Vote endpoints
  @Get('questions/:id/votes')
  async getQuestionVotes(@Param('id') questionId: string) {
    return this.forumService.getQuestionVoteCounts(questionId);
  }

  @Get('questions/:id/vote-status')
  @UseGuards(JwtAuthGuard)
  async getQuestionVoteStatus(
    @Param('id') questionId: string,
    @Request() req: { user: User }
  ) {
    return this.forumService.getUserVoteStatus(questionId, req.user);
  }

  @Get('answers/:id/votes')
  async getAnswerVotes(@Param('id') answerId: string) {
    return this.forumService.getAnswerVoteCounts(answerId);
  }

  @Get('answers/:id/vote-status')
  @UseGuards(JwtAuthGuard)
  async getAnswerVoteStatus(
    @Param('id') answerId: string,
    @Request() req: { user: User }
  ) {
    return this.forumService.getUserAnswerVoteStatus(answerId, req.user);
  }

  @Post('questions/:id/vote')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async voteQuestion(
    @Param('id') questionId: string,
    @Body() voteDto: VoteDto,
    @Request() req: { user: User }
  ) {
    await this.forumService.voteQuestion(questionId, voteDto, req.user);
  }

  @Post('answers/:id/vote')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async voteAnswer(
    @Param('id') answerId: string,
    @Body() voteDto: VoteDto,
    @Request() req: { user: User }
  ) {
    await this.forumService.voteAnswer(answerId, voteDto, req.user);
  }

  // Tag endpoints
  @Get('tags')
  async getTags() {
    return this.forumService.getTags();
  }

  // Admin endpoints
  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getStats() {
    // Bu kısmı daha sonra implement edebiliriz
    return {
      totalQuestions: 0,
      totalAnswers: 0,
      totalUsers: 0,
      totalVotes: 0,
    };
  }
} 