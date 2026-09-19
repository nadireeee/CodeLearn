import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';
import { QuizEngController } from './quiz_eng.controller';
import { QuizEngService } from './quiz_eng.service';
import { Quiz, QuizSchema } from '../entities/quiz.entity';
import { QuizEng, QuizEngSchema } from '../entities/quiz-eng.entity';
import { QuizProgress, QuizProgressSchema } from '../entities/quiz-progress.entity';
import { QuizSeeder } from '../seeding/quiz.seeder';
import { BadgeModule } from '../badge/badge.module';
import { User } from '../entities/user.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Quiz.name, schema: QuizSchema },
      { name: QuizEng.name, schema: QuizEngSchema },
      { name: QuizProgress.name, schema: QuizProgressSchema },
    ]),
    TypeOrmModule.forFeature([User]),
    BadgeModule,
  ],
  controllers: [QuizController, QuizEngController],
  providers: [QuizService, QuizEngService, QuizSeeder],
  exports: [QuizService, QuizEngService, QuizSeeder],
})
export class QuizModule {} 