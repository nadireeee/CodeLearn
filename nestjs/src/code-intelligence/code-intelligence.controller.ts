import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CodeIntelligenceService } from './code-intelligence.service';
import { RealTimeAnalyzerService } from './real-time-analyzer.service';
import { CodeSuggestionService } from './code-suggestion.service';

@Controller('code-intelligence')
@UseGuards(JwtAuthGuard)
export class CodeIntelligenceController {
  constructor(
    private readonly codeIntelligenceService: CodeIntelligenceService,
    private readonly realTimeAnalyzer: RealTimeAnalyzerService,
    private readonly codeSuggestion: CodeSuggestionService,
  ) {}

  @Post('sessions')
  async startSession(
    @CurrentUser() user: any,
    @Body() body: {
      sessionId: string;
      language: 'c' | 'cpp';
      question?: string;
    }
  ) {
    return await this.codeIntelligenceService.startCodeSession(
      user.id,
      body.sessionId,
      body.language,
      body.question
    );
  }

  @Get('sessions')
  async getUserSessions(@CurrentUser() user: any) {
    return await this.codeIntelligenceService.getUserSessions(user.id);
  }

  @Get('sessions/:sessionId')
  async getSession(
    @CurrentUser() user: any,
    @Param('sessionId') sessionId: string
  ) {
    return await this.codeIntelligenceService.getCodeSession(user.id, sessionId);
  }

  @Delete('sessions/:sessionId')
  async deleteSession(
    @CurrentUser() user: any,
    @Param('sessionId') sessionId: string
  ) {
    await this.codeIntelligenceService.deleteCodeSession(user.id, sessionId);
    return { message: 'Session deleted successfully' };
  }

  @Post('analyze')
  async analyzeCode(
    @CurrentUser() user: any,
    @Body() body: {
      sessionId: string;
      code: string;
      language: 'c' | 'cpp';
      question?: string;
      expectedOutput?: string;
      currentLine?: number;
    }
  ) {
    return await this.realTimeAnalyzer.analyzeCodeChange(
      user.id,
      body.sessionId,
      body.code,
      body.language,
      {
        question: body.question,
        expectedOutput: body.expectedOutput,
        currentLine: body.currentLine,
      }
    );
  }

  @Post('completion')
  async getCompletionSuggestions(
    @CurrentUser() user: any,
    @Body() body: {
      sessionId: string;
      code: string;
      language: 'c' | 'cpp';
      cursorPosition: number;
      context?: string;
    }
  ) {
    return await this.realTimeAnalyzer.generateCompletionSuggestions(
      user.id,
      body.sessionId,
      body.code,
      body.language,
      body.cursorPosition,
      body.context
    );
  }

  @Post('error-fixes')
  async getErrorFixes(
    @CurrentUser() user: any,
    @Body() body: {
      sessionId: string;
      code: string;
      language: 'c' | 'cpp';
      errors: any[];
    }
  ) {
    return await this.realTimeAnalyzer.generateErrorFixes(
      user.id,
      body.sessionId,
      body.code,
      body.language,
      body.errors
    );
  }

  @Post('chat')
  async chatWithAI(
    @CurrentUser() user: any,
    @Body() body: {
      sessionId: string;
      message: string;
      code: string;
      language: 'c' | 'cpp';
      question?: string;
    }
  ) {
    return await this.realTimeAnalyzer.chatWithAI(
      user.id,
      body.sessionId,
      body.message,
      body.code,
      body.language,
      { question: body.question }
    );
  }

  @Post('optimize')
  async optimizeCode(
    @CurrentUser() user: any,
    @Body() body: {
      code: string;
      language: 'c' | 'cpp';
      focus?: 'performance' | 'readability' | 'security';
    }
  ) {
    return await this.codeSuggestion.optimizeCode(
      body.code,
      body.language,
      body.focus
    );
  }

  @Get('suggestions')
  async getUserSuggestions(
    @CurrentUser() user: any,
    @Query('sessionId') sessionId?: string,
    @Query('type') type?: string
  ) {
    return await this.codeSuggestion.getUserSuggestions(user.id, sessionId, type);
  }

  @Put('suggestions/:suggestionId/apply')
  async applySuggestion(
    @CurrentUser() user: any,
    @Param('suggestionId') suggestionId: string
  ) {
    await this.codeSuggestion.markSuggestionAsApplied(user.id, suggestionId);
    return { message: 'Suggestion applied successfully' };
  }

  @Delete('suggestions/:suggestionId')
  async deleteSuggestion(
    @CurrentUser() user: any,
    @Param('suggestionId') suggestionId: string
  ) {
    await this.codeSuggestion.deleteSuggestion(user.id, suggestionId);
    return { message: 'Suggestion deleted successfully' };
  }

  @Get('sessions/:sessionId/stats')
  async getSessionStats(
    @CurrentUser() user: any,
    @Param('sessionId') sessionId: string
  ) {
    return await this.codeIntelligenceService.getSessionStats(user.id, sessionId);
  }

  @Post('insights')
  async getCodeInsights(
    @CurrentUser() user: any,
    @Body() body: {
      sessionId: string;
      code: string;
      language: 'c' | 'cpp';
    }
  ) {
    return await this.realTimeAnalyzer.getCodeInsights(
      user.id,
      body.sessionId,
      body.code,
      body.language
    );
  }

  @Post('export/:sessionId')
  async exportSession(
    @CurrentUser() user: any,
    @Param('sessionId') sessionId: string
  ) {
    return await this.codeIntelligenceService.exportSession(user.id, sessionId);
  }
} 