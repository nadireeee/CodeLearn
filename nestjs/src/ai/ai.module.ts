import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { ChatMessage, ChatMessageSchema } from './schemas/chat-message.schema';
import { RandomQuestionAgent } from './agents/random-question.agent';
import { OnboardingModule } from '../onboarding/onboarding.module';
import { ProjectModule } from '../project/project.module';
import { CodeCompletionAgent } from './agents/code-completion.agent';
import { CodeAnalysisAgent } from './agents/code-analysis.agent';
import { ErrorDetectionAgent } from './agents/error-detector.agent';
import { BadgeModule } from '../badge/badge.module';
import { User } from '../entities/user.entity';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: ChatMessage.name, schema: ChatMessageSchema },
    ]),
    TypeOrmModule.forFeature([User]),
    OnboardingModule,
    ProjectModule,
    BadgeModule,
  ],
  controllers: [AiController],
  providers: [
    AiService,
    RandomQuestionAgent,
    CodeCompletionAgent,
    CodeAnalysisAgent,
    ErrorDetectionAgent,
  ],
  exports: [
    AiService,
    RandomQuestionAgent,
    CodeCompletionAgent,
    CodeAnalysisAgent,
    ErrorDetectionAgent,
  ],
})
export class AiModule {} 