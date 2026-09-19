import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Subject, SubjectSchema } from '../entities/subject.entity';
import { UserProgress, UserProgressSchema } from '../entities/user-progress.entity';
import { SubjectsSeeder } from './subjects.seeder';
import { LessonsSeeder } from './lessons-seeder';
import { ChapterSchema } from '../lessons/entities/chapter.entity';
import { TopicSchema } from '../lessons/entities/topic.entity';
import { LessonSchema as NewLessonSchema } from '../lessons/entities/lesson.entity';
import { ChapterTestSchema } from '../lessons/entities/chapter-test.entity';
import { UserLessonProgressSchema } from '../lessons/entities/user-lesson-progress.entity';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://root:rootpassword@localhost:27017', {
      dbName: 'codelearn_ai',
    }),
    MongooseModule.forFeature([
      { name: Subject.name, schema: SubjectSchema },
      { name: UserProgress.name, schema: UserProgressSchema },
      // New lessons system schemas
      { name: 'lessons_c_tr', schema: ChapterSchema },
      { name: 'lessons_c_tr', schema: TopicSchema },
      { name: 'lessons_c_tr', schema: NewLessonSchema },
      { name: 'lessons_c_tr', schema: ChapterTestSchema },
      { name: 'lessons_c_tr', schema: UserLessonProgressSchema },
      
      { name: 'lessons_c_en', schema: ChapterSchema },
      { name: 'lessons_c_en', schema: TopicSchema },
      { name: 'lessons_c_en', schema: NewLessonSchema },
      { name: 'lessons_c_en', schema: ChapterTestSchema },
      { name: 'lessons_c_en', schema: UserLessonProgressSchema },
      
      { name: 'lessons_cpp_tr', schema: ChapterSchema },
      { name: 'lessons_cpp_tr', schema: TopicSchema },
      { name: 'lessons_cpp_tr', schema: NewLessonSchema },
      { name: 'lessons_cpp_tr', schema: ChapterTestSchema },
      { name: 'lessons_cpp_tr', schema: UserLessonProgressSchema },
      
      { name: 'lessons_cpp_en', schema: ChapterSchema },
      { name: 'lessons_cpp_en', schema: TopicSchema },
      { name: 'lessons_cpp_en', schema: NewLessonSchema },
      { name: 'lessons_cpp_en', schema: ChapterTestSchema },
      { name: 'lessons_cpp_en', schema: UserLessonProgressSchema },
    ]),
  ],
  providers: [SubjectsSeeder, LessonsSeeder],
  exports: [SubjectsSeeder, LessonsSeeder],
})
export class MongoSeedModule {} 