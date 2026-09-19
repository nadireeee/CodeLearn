import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { User } from '../entities/user.entity';
import { Property } from '../entities/property.entity';
import { PropertyType } from '../entities/propertyType.entity';
import { PropertyFeature } from '../entities/propertyFeature.entity';
import { Subject } from '../entities/subject.entity';
import { Quiz } from '../entities/quiz.entity';
import { QuizProgress } from '../entities/quiz-progress.entity';
import { UserProgress } from '../entities/user-progress.entity';

export default (): PostgresConnectionOptions => ({
  // Don't put this here, Instead put in the env file
  url: process.env.url,
  type: 'postgres',
  port: +process.env.port,
  entities: [
    User,
    Property,
    PropertyType,
    PropertyFeature,
    Subject,
    Quiz,
    QuizProgress,
    UserProgress,
  ],
  synchronize: false,
});
