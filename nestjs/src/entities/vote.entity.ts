import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, Unique } from 'typeorm';
import { User } from './user.entity';
import { Question } from './question.entity';
import { Answer } from './answer.entity';

export enum VoteType {
  UP = 1,
  DOWN = -1
}

@Entity('votes')
@Unique(['userId', 'questionId'])
@Unique(['userId', 'answerId'])
export class Vote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: VoteType })
  type: VoteType;

  @ManyToOne(() => User, user => user.votes, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Question, question => question.votes, { onDelete: 'CASCADE', nullable: true })
  question: Question;

  @Column({ nullable: true })
  questionId: string;

  @ManyToOne(() => Answer, answer => answer.votes, { onDelete: 'CASCADE', nullable: true })
  answer: Answer;

  @Column({ nullable: true })
  answerId: string;

  @CreateDateColumn()
  createdAt: Date;
} 