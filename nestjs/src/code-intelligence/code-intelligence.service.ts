import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CodeSession, CodeSessionDocument } from './schemas/code-session.schema';
import { Suggestion, SuggestionDocument } from './schemas/suggestion.schema';
import { RealTimeAnalyzerService } from './real-time-analyzer.service';
import { CodeSuggestionService } from './code-suggestion.service';

@Injectable()
export class CodeIntelligenceService {
  private readonly logger = new Logger(CodeIntelligenceService.name);

  constructor(
    @InjectModel(CodeSession.name) private codeSessionModel: Model<CodeSessionDocument>,
    @InjectModel(Suggestion.name) private suggestionModel: Model<SuggestionDocument>,
    private readonly realTimeAnalyzer: RealTimeAnalyzerService,
    private readonly codeSuggestion: CodeSuggestionService,
  ) {}

  async startCodeSession(
    userId: string,
    sessionId: string,
    language: 'c' | 'cpp',
    question?: string
  ): Promise<CodeSession> {
    try {
      const session = new this.codeSessionModel({
        userId,
        sessionId,
        code: '',
        language,
        question,
        currentLine: 0,
        analysis: {
          quality: 70,
          analysis: 'Yeni session başlatıldı',
          issues: [],
          suggestions: [],
          complexity: 5,
          maintainability: 70,
          performance: 70,
          security: 70,
        },
        codeErrors: [],
        hints: [],
        isOnTrack: true,
      });

      await session.save();
      this.logger.log(`Started code session for user: ${userId}, session: ${sessionId}`);
      return session;
    } catch (error) {
      this.logger.error('Error starting code session:', error);
      throw error;
    }
  }

  async getCodeSession(
    userId: string,
    sessionId: string
  ): Promise<CodeSession | null> {
    try {
      return await this.codeSessionModel.findOne({ userId, sessionId }).exec();
    } catch (error) {
      this.logger.error('Error getting code session:', error);
      return null;
    }
  }

  async getUserSessions(userId: string): Promise<CodeSession[]> {
    try {
      return await this.codeSessionModel
        .find({ userId })
        .sort({ updatedAt: -1 })
        .limit(20)
        .exec();
    } catch (error) {
      this.logger.error('Error getting user sessions:', error);
      return [];
    }
  }

  async deleteCodeSession(userId: string, sessionId: string): Promise<void> {
    try {
      await this.codeSessionModel.findOneAndDelete({ userId, sessionId });
      await this.suggestionModel.deleteMany({ userId, sessionId });
      this.logger.log(`Deleted code session for user: ${userId}, session: ${sessionId}`);
    } catch (error) {
      this.logger.error('Error deleting code session:', error);
    }
  }

  async getSessionStats(userId: string, sessionId: string): Promise<any> {
    try {
      const session = await this.getCodeSession(userId, sessionId);
      const suggestions = await this.suggestionModel
        .find({ userId, sessionId })
        .exec();

      if (!session) {
        return null;
      }

      return {
        totalLines: session.code.split('\n').length,
        totalErrors: session.codeErrors.length,
        totalSuggestions: suggestions.length,
        appliedSuggestions: suggestions.filter(s => s.isApplied).length,
        sessionDuration: Date.now() - session.createdAt.getTime(),
        isOnTrack: session.isOnTrack,
        quality: session.analysis?.quality || 70,
        complexity: session.analysis?.complexity || 5,
        maintainability: session.analysis?.maintainability || 70,
        performance: session.analysis?.performance || 70,
        security: session.analysis?.security || 70,
      };
    } catch (error) {
      this.logger.error('Error getting session stats:', error);
      return null;
    }
  }

  async exportSession(userId: string, sessionId: string): Promise<any> {
    try {
      const session = await this.getCodeSession(userId, sessionId);
      const suggestions = await this.suggestionModel
        .find({ userId, sessionId })
        .exec();

      if (!session) {
        return null;
      }

      return {
        session: {
          id: session._id,
          sessionId: session.sessionId,
          code: session.code,
          language: session.language,
          question: session.question,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
        },
        analysis: session.analysis,
        codeErrors: session.codeErrors,
        suggestions: suggestions,
        stats: await this.getSessionStats(userId, sessionId),
      };
    } catch (error) {
      this.logger.error('Error exporting session:', error);
      return null;
    }
  }
} 