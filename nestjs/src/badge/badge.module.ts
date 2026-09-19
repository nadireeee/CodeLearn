import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BadgeController } from './badge.controller';
import { BadgeService } from './badge.service';
import { Badge, BadgeSchema } from '../entities/badge.entity';
import { UserBadge, UserBadgeSchema } from '../entities/user-badge.entity';
import { QuizProgress, QuizProgressSchema } from '../entities/quiz-progress.entity';
import { User } from '../entities/user.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Badge.name, schema: BadgeSchema },
      { name: UserBadge.name, schema: UserBadgeSchema },
      { name: QuizProgress.name, schema: QuizProgressSchema },
    ]),
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [BadgeController],
  providers: [BadgeService],
  exports: [BadgeService],
})
export class BadgeModule {} 