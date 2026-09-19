import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';
import { Question } from './question.entity';
import { Answer } from './answer.entity';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  content: string;

  @ManyToOne(() => Question, question => question.comments, { onDelete: 'CASCADE', nullable: true })
  question: Question;

  @Column({ nullable: true })
  questionId: string;

  @ManyToOne(() => Answer, answer => answer.comments, { onDelete: 'CASCADE', nullable: true })
  answer: Answer;

  @Column({ nullable: true })
  answerId: string;

  @ManyToOne(() => User, user => user.comments, { onDelete: 'CASCADE' })
  author: User;

  @Column()
  authorId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 