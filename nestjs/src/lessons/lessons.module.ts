import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LessonsController } from './lessons.controller';
import { LessonsService } from './lessons.service';
import { ChapterSchema } from './entities/chapter.entity';
import { TopicSchema } from './entities/topic.entity';
import { LessonSchema } from './entities/lesson.entity';
import { ChapterTestSchema } from './entities/chapter-test.entity';
import { UserLessonProgressSchema } from './entities/user-lesson-progress.entity';
import { User } from '../entities/user.entity';
import { BadgeModule } from '../badge/badge.module';

@Module({
  imports: [
    // MongoDB schemas - Her koleksiyon için sadece BİR şema tanımlıyoruz
    // Tüm entity'ler aynı koleksiyonda tutulduğu için ortak bir şema kullanıyoruz
    MongooseModule.forFeature([
      // C - Turkish (tek koleksiyon, tüm entity'ler için)
      { name: 'lessons_c_tr', schema: ChapterSchema },
      
      // C - English (tek koleksiyon, tüm entity'ler için)
      { name: 'lessons_c_en', schema: ChapterSchema },
      
      // C++ - Turkish (tek koleksiyon, tüm entity'ler için)
      { name: 'lessons_cpp_tr', schema: ChapterSchema },
      
      // C++ - English (tek koleksiyon, tüm entity'ler için)
      { name: 'lessons_cpp_en', schema: ChapterSchema },
    ]),
    
    // PostgreSQL entities
    TypeOrmModule.forFeature([User]),
    
    // Badge module for badge integration
    BadgeModule,
  ],
  controllers: [LessonsController],
  providers: [LessonsService],
  exports: [LessonsService],
})
export class LessonsModule {} 