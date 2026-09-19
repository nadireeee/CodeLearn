import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CodeSession } from './schemas/code-session.schema';
import { CodeCompletionAgent } from '../ai/agents/code-completion.agent';
import { CodeAnalysisAgent } from '../ai/agents/code-analysis.agent';
import { ErrorDetectionAgent } from '../ai/agents/error-detector.agent';
import { AiService } from '../ai/ai.service';

@Injectable()
export class RealTimeAnalyzerService {
  private readonly logger = new Logger(RealTimeAnalyzerService.name);

  constructor(
    @InjectModel(CodeSession.name) private codeSessionModel: Model<CodeSession>,
    private readonly codeCompletionAgent: CodeCompletionAgent,
    private readonly codeAnalysisAgent: CodeAnalysisAgent,
    private readonly errorDetectionAgent: ErrorDetectionAgent,
    private readonly aiService: AiService,
  ) {}

  async analyzeCodeChange(
    userId: string,
    sessionId: string,
    code: string,
    language: 'c' | 'cpp',
    options?: any
  ): Promise<any> {
    try {
      // ✅ Paralel analiz - tüm agent'ları aynı anda çalıştır
      const [analysis, errors, codeSmells] = await Promise.all([
        this.codeAnalysisAgent.analyzeCode(code, language, options?.question, userId),
        this.errorDetectionAgent.detectErrors(code, language, undefined, userId),
        this.codeAnalysisAgent.detectCodeSmells(code, language, userId)
      ]);

      // Session'ı güncelle
      await this.updateCodeSession(sessionId, code, analysis, errors);

      return {
        analysis: analysis.analysis || 'Kod analizi tamamlandı.',
        errors: errors,
        codeSmells: codeSmells,
        quality: analysis.quality,
        complexity: analysis.complexity,
        maintainability: analysis.maintainability,
        performance: analysis.performance,
        security: analysis.security,
        suggestions: analysis.suggestions
      };
    } catch (error) {
      this.logger.error('Error analyzing code change:', error);
      throw error;
    }
  }

  async generateCompletionSuggestions(
    userId: string,
    sessionId: string,
    code: string,
    language: 'c' | 'cpp',
    cursorPosition: number,
    context?: string
  ): Promise<{ suggestions: string[] }> {
    try {
      // ✅ Agent kullanarak completion önerileri
      const suggestions = await this.codeCompletionAgent.generateCompletion(
        code,
        language,
        cursorPosition,
        context,
        userId
      );

      // Eğer AI önerileri yetersizse, common patterns ekle
      if (suggestions.length < 3) {
        const commonPatterns = await this.codeCompletionAgent.getCommonPatterns(language);
        const filteredPatterns = commonPatterns.filter(pattern => 
          !suggestions.some(s => s.includes(pattern.split('(')[0]))
        );
        suggestions.push(...filteredPatterns.slice(0, 3 - suggestions.length));
      }

      return { suggestions };
    } catch (error) {
      this.logger.error('Error generating completion suggestions:', error);
      return { suggestions: [] };
    }
  }

  async generateErrorFixes(
    userId: string,
    sessionId: string,
    code: string,
    language: 'c' | 'cpp',
    errors: any[]
  ): Promise<any[]> {
    try {
      // ✅ Error detection agent kullanarak düzeltme önerileri
      const fixes = await this.errorDetectionAgent.suggestErrorFixes(
        code,
        language,
        errors,
        userId
      );

      return fixes.map(fix => ({
        error: fix.error,
        fix: fix.fix,
        explanation: fix.explanation,
        confidence: fix.confidence,
        impact: fix.impact
      }));
    } catch (error) {
      this.logger.error('Error generating error fixes:', error);
      return [];
    }
  }

  async chatWithAI(
    userId: string,
    sessionId: string,
    message: string,
    code: string,
    language: 'c' | 'cpp',
    options?: any
  ): Promise<{ response: string }> {
    try {
      // ✅ Context-aware AI chat
      const context = await this.buildChatContext(sessionId, code, language);
      
      const enhancedMessage = `Kod bağlamı:
\`\`\`${language}
${code}
\`\`\`

Kullanıcı sorusu: ${message}

${context ? `Önceki analiz: ${context}` : ''}

Lütfen bu kod bağlamında kullanıcının sorusunu yanıtla.`;

      const response = await this.aiService.generateResponse(enhancedMessage, userId);
      
      // Session'a mesajı kaydet
      await this.addChatMessage(sessionId, message, response);

      return { response };
    } catch (error) {
      this.logger.error('Error chatting with AI:', error);
      throw error;
    }
  }

  async validateCode(
    userId: string,
    sessionId: string,
    code: string,
    language: 'c' | 'cpp'
  ): Promise<any> {
    try {
      // ✅ Code validation using error detection agent
      const validation = await this.errorDetectionAgent.validateCode(code, language, userId);
      
      return {
        isValid: validation.isValid,
        errors: validation.errors,
        warnings: validation.warnings,
        suggestions: validation.suggestions
      };
    } catch (error) {
      this.logger.error('Error validating code:', error);
      return {
        isValid: true,
        errors: [],
        warnings: [],
        suggestions: []
      };
    }
  }

  async autoFixCode(
    userId: string,
    sessionId: string,
    code: string,
    language: 'c' | 'cpp'
  ): Promise<{
    fixedCode: string;
    appliedFixes: any[];
    remainingErrors: any[];
  }> {
    try {
      // ✅ Auto-fix using error detection agent
      const errors = await this.errorDetectionAgent.detectErrors(code, language, undefined, userId);
      const autoFix = await this.errorDetectionAgent.autoFixErrors(code, language, errors);
      
      return {
        fixedCode: autoFix.fixedCode,
        appliedFixes: autoFix.appliedFixes,
        remainingErrors: autoFix.remainingErrors
      };
    } catch (error) {
      this.logger.error('Error auto-fixing code:', error);
      return {
        fixedCode: code,
        appliedFixes: [],
        remainingErrors: []
      };
    }
  }

  async getCodeInsights(
    userId: string,
    sessionId: string,
    code: string,
    language: 'c' | 'cpp'
  ): Promise<any> {
    try {
      // ✅ Comprehensive code insights using all agents
      const [analysis, errors, codeSmells, refactoring, performance] = await Promise.all([
        this.codeAnalysisAgent.analyzeCode(code, language, undefined, userId),
        this.errorDetectionAgent.detectErrors(code, language, undefined, userId),
        this.codeAnalysisAgent.detectCodeSmells(code, language, userId),
        this.codeAnalysisAgent.suggestRefactoring(code, language, userId),
        this.codeAnalysisAgent.analyzePerformance(code, language, userId)
      ]);

      return {
        quality: analysis.quality,
        complexity: analysis.complexity,
        maintainability: analysis.maintainability,
        performance: analysis.performance,
        security: analysis.security,
        errors: errors,
        codeSmells: codeSmells,
        refactoringSuggestions: refactoring,
        performanceSuggestions: performance,
        overallScore: this.calculateOverallScore(analysis, errors, codeSmells)
      };
    } catch (error) {
      this.logger.error('Error getting code insights:', error);
      throw error;
    }
  }

  private async updateCodeSession(
    sessionId: string,
    code: string,
    analysis: any,
    errors: any[]
  ): Promise<void> {
    try {
      await this.codeSessionModel.findOneAndUpdate(
        { sessionId },
        {
          $set: {
            lastCode: code,
            analysis: analysis,
            lastErrors: errors,
            updatedAt: new Date()
          },
          $inc: { analysisCount: 1 }
        }
      );
    } catch (error) {
      this.logger.error('Error updating code session:', error);
    }
  }

  private async buildChatContext(sessionId: string, code: string, language: 'c' | 'cpp'): Promise<string> {
    try {
      const session = await this.codeSessionModel.findOne({ sessionId });
      if (!session || !session.analysis) return '';

      const analysis = session.analysis;
      // Check if analysis has the expected properties
      if (typeof analysis.quality === 'number') {
        return `Önceki analiz sonuçları:
- Kalite: ${analysis.quality}/100
- Karmaşıklık: ${analysis.complexity || 'N/A'}/10
- Bakım: ${analysis.maintainability || 'N/A'}/100
- Performans: ${analysis.performance || 'N/A'}/100
- Güvenlik: ${analysis.security || 'N/A'}/100`;
      } else {
        // Fallback for old analysis format
        return `Önceki analiz mevcut`;
      }
    } catch (error) {
      this.logger.error('Error building chat context:', error);
      return '';
    }
  }

  private async addChatMessage(sessionId: string, userMessage: string, aiResponse: string): Promise<void> {
    try {
      await this.codeSessionModel.findOneAndUpdate(
        { sessionId },
        {
          $push: {
            chatHistory: {
              role: 'user',
              content: userMessage,
              timestamp: new Date()
            }
          }
        }
      );

      await this.codeSessionModel.findOneAndUpdate(
        { sessionId },
        {
          $push: {
            chatHistory: {
              role: 'assistant',
              content: aiResponse,
              timestamp: new Date()
            }
          }
        }
      );
    } catch (error) {
      this.logger.error('Error adding chat message:', error);
    }
  }

  private calculateOverallScore(analysis: any, errors: any[], codeSmells: any[]): number {
    let score = analysis.quality || 70;
    
    // Error penalty
    const errorPenalty = errors.filter(e => e.severity === 'error').length * 5;
    const warningPenalty = errors.filter(e => e.severity === 'warning').length * 2;
    
    // Code smell penalty
    const smellPenalty = codeSmells.filter(s => s.severity === 'high' || s.severity === 'critical').length * 3;
    
    score = Math.max(0, score - errorPenalty - warningPenalty - smellPenalty);
    
    return Math.round(score);
  }
} 