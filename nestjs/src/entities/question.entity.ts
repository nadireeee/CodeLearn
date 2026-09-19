import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { User } from './user.entity';
import { Answer } from './answer.entity';
import { Comment } from './comment.entity';
import { Vote } from './vote.entity';
import { Tag } from './tag.entity';

export enum QuestionStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  DUPLICATE = 'duplicate',
  OFF_TOPIC = 'off_topic'
}

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'enum', enum: QuestionStatus, default: QuestionStatus.OPEN })
  status: QuestionStatus;

  @Column({ type: 'int', default: 0 })
  viewCount: number;

  @Column({ type: 'int', default: 0 })
  answerCount: number;

  @Column({ type: 'int', default: 0 })
  voteCount: number;

  @Column({ type: 'boolean', default: false })
  isAnswered: boolean;

  @Column({ type: 'varchar', length: 50, default: 'C' })
  category: string;

  @ManyToOne(() => User, user => user.questions, { onDelete: 'CASCADE' })
  author: User;

  @Column()
  authorId: string;

  @OneToMany(() => Answer, answer => answer.question, { cascade: true })
  answers: Answer[];

  @OneToMany(() => Comment, comment => comment.question, { cascade: true })
  comments: Comment[];

  @OneToMany(() => Vote, vote => vote.question, { cascade: true })
  votes: Vote[];

  @ManyToMany(() => Tag, tag => tag.questions)
  @JoinTable({
    name: 'question_tags',
    joinColumn: { name: 'questionId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tagId', referencedColumnName: 'id' }
  })
  tags: Tag[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 