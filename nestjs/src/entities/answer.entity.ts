import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Question } from './question.entity';
import { Comment } from './comment.entity';
import { Vote } from './vote.entity';

@Entity('answers')
export class Answer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'boolean', default: false })
  isAccepted: boolean;

  @Column({ type: 'int', default: 0 })
  voteCount: number;

  @ManyToOne(() => Question, question => question.answers, { onDelete: 'CASCADE' })
  question: Question;

  @Column()
  questionId: string;

  @ManyToOne(() => User, user => user.answers, { onDelete: 'CASCADE' })
  author: User;

  @Column()
  authorId: string;

  @OneToMany(() => Comment, comment => comment.answer, { cascade: true })
  comments: Comment[];

  @OneToMany(() => Vote, vote => vote.answer, { cascade: true })
  votes: Vote[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 