import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ChapterTestDocument = ChapterTest & Document;

export interface TestQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'code-completion' | 'fill-blank';
  options?: string[];
  correctAnswer: string | number;
  explanation: string;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  codeContext?: string;
  hints?: string[];
}

@Schema({ timestamps: true })
export class ChapterTest {
  @Prop({ required: true, unique: true })
  id: string; // "test_chapter_0_c_tr"

  @Prop({ required: true })
  chapterId: string; // "chapter_0_c_tr"

  @Prop({ required: true })
  title: string; // "Introduction Test"

  @Prop({ required: true, enum: ['c', 'cpp'] })
  language: 'c' | 'cpp';

  @Prop({ required: true, enum: ['tr', 'en'] })
  locale: 'tr' | 'en';

  @Prop({ required: true, type: Array })
  questions: TestQuestion[]; // 20 soru

  @Prop({ default: 60 }) // dakika
  timeLimit: number;

  @Prop({ default: 70 }) // %70 geçme notu
  passingScore: number;

  @Prop({ default: 100 })
  totalPoints: number;

  @Prop({ type: Object, default: {} })
  rewards: {
    xp: number;
    badge?: string;
    title?: string;
  };

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  attemptCount: number;

  @Prop({ default: 0 })
  passCount: number;

  @Prop({ default: 0 })
  averageScore: number;

  @Prop()
  description?: string;

  @Prop({ type: [String], default: [] })
  tags: string[];
}

export const ChapterTestSchema = SchemaFactory.createForClass(ChapterTest); 