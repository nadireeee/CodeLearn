import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuizEngController } from './quiz_eng.controller';
import { QuizEngService } from './quiz_eng.service';
import { QuizEng, QuizEngSchema } from '../entities/quiz-eng.entity';
import { QuizProgress, QuizProgressSchema } from '../entities/quiz-progress.entity';
import { User } from '../entities/user.entity';
import { BadgeModule } from '../badge/badge.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: QuizEng.name, schema: QuizEngSchema },
      { name: QuizProgress.name, schema: QuizProgressSchema },
    ]),
    TypeOrmModule.forFeature([User]), // 🔥 User entity'sini ekle
    BadgeModule,
  ],
  controllers: [QuizEngController],
  providers: [QuizEngService],
  exports: [QuizEngService],
})
export class QuizEngModule {} 