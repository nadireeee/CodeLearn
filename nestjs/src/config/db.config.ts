import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { registerAs } from '@nestjs/config';
import { User } from '../entities/user.entity';
import { Property } from '../entities/property.entity';
import { PropertyType } from '../entities/propertyType.entity';
import { PropertyFeature } from '../entities/propertyFeature.entity';
import { Subject } from '../entities/subject.entity';
import { Quiz } from '../entities/quiz.entity';
import { QuizProgress } from '../entities/quiz-progress.entity';
import { UserProgress } from '../entities/user-progress.entity';
import { Question } from '../entities/question.entity';
import { Answer } from '../entities/answer.entity';
import { Comment } from '../entities/comment.entity';
import { Vote } from '../entities/vote.entity';
import { Tag } from '../entities/tag.entity';

export default registerAs(
  'dbconfig.dev',
  (): PostgresConnectionOptions => ({
    type: 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: +(process.env.POSTGRES_PORT || 5432),
    username: process.env.POSTGRES_USER || 'nestjs_user',
    password: process.env.POSTGRES_PASSWORD || 'nestjs_password',
    database: process.env.POSTGRES_DB || 'nestjs_db',
    entities: [
      User,
      Property,
      PropertyType,
      PropertyFeature,
      Subject,
      Quiz,
      QuizProgress,
      UserProgress,
      Question,
      Answer,
      Comment,
      Vote,
      Tag,
    ],
    synchronize: true,
  }),
);
