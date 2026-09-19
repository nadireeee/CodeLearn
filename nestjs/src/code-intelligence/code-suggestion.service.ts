import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Suggestion, SuggestionDocument } from './schemas/suggestion.schema';
import { CodeCompletionAgent } from '../ai/agents/code-completion.agent';
import { CodeAnalysisAgent } from '../ai/agents/code-analysis.agent';
import { ErrorDetectionAgent } from '../ai/agents/error-detector.agent';
import { AiService } from '../ai/ai.service';

@Injectable()
export class CodeSuggestionService {
  private readonly logger = new Logger(CodeSuggestionService.name);

  constructor(
    @InjectModel(Suggestion.name) private suggestionModel: Model<SuggestionDocument>,
    private readonly codeCompletionAgent: CodeCompletionAgent,
    private readonly codeAnalysisAgent: CodeAnalysisAgent,
    private readonly errorDetectionAgent: ErrorDetectionAgent,
    private readonly aiService: AiService,
  ) {}

  async generateCompletionSuggestions(
    code: string,
    language: 'c' | 'cpp',
    cursorPosition: number,
    context?: string,
    userId?: string
  ): Promise<{
    suggestions: string[];
    explanations: string[];
  }> {
    try {
      const suggestions = await this.codeCompletionAgent.generateCompletion(
        code,
        language,
        cursorPosition,
        context,
        userId
      );
      
      return {
        suggestions,
        explanations: suggestions.map(s => `Önerilen kod: ${s}`),
      };
    } catch (error) {
      this.logger.error('Error generating completion suggestions:', error);
      return {
        suggestions: [],
        explanations: [],
      };
    }
  }

  async generateErrorFixes(
    code: string,
    language: 'c' | 'cpp',
    errors: any[],
    userId?: string
  ): Promise<{
    fixedCode: string;
    explanations: string[];
  }> {
    try {
      const fixes = await this.errorDetectionAgent.suggestErrorFixes(
        code,
        language,
        errors,
        userId
      );
      
      let fixedCode = code;
      const explanations: string[] = [];
      
      for (const fix of fixes) {
        if (fix.confidence > 0.7) {
          // Basit string replacement - gerçek uygulamada daha sofistike olmalı
          const lines = fixedCode.split('\n');
          if (lines[fix.error.line - 1] && fix.fix) {
            lines[fix.error.line - 1] = fix.fix;
            fixedCode = lines.join('\n');
            explanations.push(fix.explanation);
          }
        }
      }
      
      return {
        fixedCode,
        explanations: explanations.length > 0 ? explanations : ['Hata düzeltme yapılamadı.'],
      };
    } catch (error) {
      this.logger.error('Error generating error fixes:', error);
      return {
        fixedCode: code,
        explanations: ['Hata düzeltme yapılamadı.'],
      };
    }
  }

  async optimizeCode(
    code: string,
    language: 'c' | 'cpp',
    focus?: 'performance' | 'readability' | 'security',
    userId?: string
  ): Promise<{
    optimizedCode: string;
    improvements: string[];
    beforeAfter: {
      before: string;
      after: string;
      explanation: string;
    }[];
  }> {
    try {
      let suggestions: any[] = [];
      
      if (focus === 'performance') {
        suggestions = await this.codeAnalysisAgent.analyzePerformance(code, language, userId);
      } else if (focus === 'readability') {
        suggestions = await this.codeAnalysisAgent.suggestRefactoring(code, language, userId);
      } else {
        // General optimization
        const [performance, refactoring] = await Promise.all([
          this.codeAnalysisAgent.analyzePerformance(code, language, userId),
          this.codeAnalysisAgent.suggestRefactoring(code, language, userId)
        ]);
        suggestions = [...performance, ...refactoring];
      }

      const improvements = suggestions.map(s => s.description);
      
      return {
        optimizedCode: code, // Gerçek implementasyonda optimize edilmiş kod döndürülür
        improvements,
        beforeAfter: suggestions.map(s => ({
          before: code,
          after: s.code || code,
          explanation: s.description
        })),
      };
    } catch (error) {
      this.logger.error('Error optimizing code:', error);
      return {
        optimizedCode: code,
        improvements: ['Optimizasyon yapılamadı.'],
        beforeAfter: [],
      };
    }
  }

  async getUserSuggestions(
    userId: string,
    sessionId?: string,
    type?: string
  ): Promise<Suggestion[]> {
    try {
      const filter: any = { userId };
      if (sessionId) filter.sessionId = sessionId;
      if (type) filter.type = type;

      return await this.suggestionModel
        .find(filter)
        .sort({ createdAt: -1 })
        .limit(50)
        .exec();
    } catch (error) {
      this.logger.error('Error getting user suggestions:', error);
      return [];
    }
  }

  async markSuggestionAsApplied(
    userId: string,
    suggestionId: string
  ): Promise<void> {
    try {
      await this.suggestionModel.findOneAndUpdate(
        { _id: suggestionId, userId },
        { isApplied: true }
      );
    } catch (error) {
      this.logger.error('Error marking suggestion as applied:', error);
    }
  }

  async deleteSuggestion(
    userId: string,
    suggestionId: string
  ): Promise<void> {
    try {
      await this.suggestionModel.findOneAndDelete({
        _id: suggestionId,
        userId,
      });
    } catch (error) {
      this.logger.error('Error deleting suggestion:', error);
    }
  }
} 