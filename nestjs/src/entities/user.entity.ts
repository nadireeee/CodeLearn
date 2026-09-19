import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Property } from './property.entity';
import { Question } from './question.entity';
import { Answer } from './answer.entity';
import { Comment } from './comment.entity';
import { Vote } from './vote.entity';

import * as bcrypt from 'bcrypt';
import { Role } from '../auth/enums/role.enum';
import { v4 as uuidv4 } from 'uuid';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  password: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.USER,
  })
  role: Role;

  @Column({ nullable: true })
  hashedRefreshToken: string;

  @Column({ 
    type: 'varchar', 
    length: 2, 
    default: 'tr' 
  })
  language: string;

  // Quiz ve rozet istatistikleri
  @Column({ default: 0 })
  totalSolvedQuestions: number;

  @Column({ default: 0 })
  totalCreatedProjects: number;

  // Ders istatistikleri
  @Column({ default: 0 })
  totalCompletedLessons: number;

  @Column({ default: 0 })
  totalPassedTests: number;

  // Property relations
  @OneToMany(() => Property, (property) => property.user)
  properties: Property[];

  @ManyToMany(() => Property, (property) => property.likedBy)
  @JoinTable({ name: 'user_liked_properties' })
  likedProperties: Property[];

  // Forum relations
  @OneToMany(() => Question, question => question.author)
  questions: Question[];

  @OneToMany(() => Answer, answer => answer.author)
  answers: Answer[];

  @OneToMany(() => Comment, comment => comment.author)
  comments: Comment[];

  @OneToMany(() => Vote, vote => vote.user)
  votes: Vote[];

  @BeforeInsert()
  async hashPassword() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }
}
