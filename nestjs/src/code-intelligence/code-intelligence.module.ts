import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CodeIntelligenceController } from './code-intelligence.controller';
import { CodeIntelligenceService } from './code-intelligence.service';
import { RealTimeAnalyzerService } from './real-time-analyzer.service';
import { CodeSuggestionService } from './code-suggestion.service';
import { CodeSession, CodeSessionSchema } from './schemas/code-session.schema';
import { Suggestion, SuggestionSchema } from './schemas/suggestion.schema';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CodeSession.name, schema: CodeSessionSchema },
      { name: Suggestion.name, schema: SuggestionSchema },
    ]),
    AiModule,
  ],
  controllers: [CodeIntelligenceController],
  providers: [
    CodeIntelligenceService,
    RealTimeAnalyzerService,
    CodeSuggestionService,
  ],
  exports: [
    CodeIntelligenceService,
    RealTimeAnalyzerService,
    CodeSuggestionService,
  ],
})
export class CodeIntelligenceModule {} 