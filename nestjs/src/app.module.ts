import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PropertyModule } from './property/property.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import dbConfig from './config/db.config';
import dbConfigProduction from './config/db.config.production';
import { MongooseModule } from '@nestjs/mongoose';
import { OnboardingModule } from './onboarding/onboarding.module';
import { AiModule } from './ai/ai.module';
import { CodeAnalysisModule } from './code-analysis/code-analysis.module';
import { CodeIntelligenceModule } from './code-intelligence/code-intelligence.module';
import { SubjectsModule } from './subjects/subjects.module';
import { QuizModule } from './quiz/quiz.module';
import { ProjectModule } from './project/project.module';
import { ForumModule } from './forum/forum.module';
import { BadgeModule } from './badge/badge.module';
import { LessonsModule } from './lessons/lessons.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      load: [dbConfig, dbConfigProduction],
    }),
    // MongoDB Connection
    MongooseModule.forRoot('mongodb://root:rootpassword@localhost:27017', {
      dbName: 'codelearn_ai',
    }),
    // PostgreSQL Connection (TypeORM)
    TypeOrmModule.forRootAsync({
      useFactory:
        process.env.NODE_ENV === 'production' ? dbConfigProduction : dbConfig,
    }),
    PropertyModule,
    UserModule,
    AuthModule,
    OnboardingModule,
    AiModule,
    CodeAnalysisModule,
    CodeIntelligenceModule,
    SubjectsModule,
    QuizModule,
    ProjectModule,
    ForumModule,
    BadgeModule,
    LessonsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
