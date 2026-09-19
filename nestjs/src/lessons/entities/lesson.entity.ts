import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LessonDocument = Lesson & Document;

// İçerik türleri için interface'ler
export interface VideoContent {
  type: 'video';
  id: string;
  title: string;
  url: string;
  duration: number;
  thumbnail?: string;
  embedUrl?: string;
}

export interface TextContent {
  type: 'text';
  id: string;
  content: string;
  style: 'heading1' | 'heading2' | 'heading3' | 'paragraph' | 'quote' | 'list';
  formatting?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    color?: string;
    backgroundColor?: string;
  };
}

export interface CodeContent {
  type: 'code';
  id: string;
  title: string;
  code: string;
  language: 'c' | 'cpp' | 'javascript' | 'python' | 'html' | 'css';
  explanation: string;
  isExecutable: boolean;
  expectedOutput?: string;
  stdin?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  hints?: string[];
}

export interface ImageContent {
  type: 'image';
  id: string;
  url: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
  clickable?: boolean;
  zoomable?: boolean;
}

export interface WarningContent {
  type: 'warning';
  id: string;
  title: string;
  content: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  icon?: string;
  color?: string;
}

export interface QuizContent {
  type: 'quiz';
  id: string;
  question: string;
  questionType: 'multiple-choice' | 'true-false' | 'fill-blank' | 'code-completion' | 'matching';
  options?: string[];
  correctAnswer: string | number | string[];
  explanation: string;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  hints?: string[];
  codeContext?: string;
}

export interface InteractiveContent {
  type: 'interactive';
  id: string;
  title: string;
  description: string;
  initialCode: string;
  language: 'c' | 'cpp';
  expectedBehavior: string;
  testCases: Array<{
    input: string;
    expectedOutput: string;
    description: string;
  }>;
}

export interface ExerciseContent {
  type: 'exercise';
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  language: 'c' | 'cpp';
  starterCode?: string;
  solution?: string;
  testCases: Array<{
    input: string;
    expectedOutput: string;
    hidden?: boolean;
  }>;
  hints?: string[];
}

export type LessonContent = VideoContent | TextContent | CodeContent | ImageContent | WarningContent | QuizContent | InteractiveContent | ExerciseContent;

@Schema({ timestamps: true })
export class Lesson {
  @Prop({ required: true, unique: true })
  id: string; // "lesson_0_1_1_c_tr"

  @Prop({ required: true })
  chapterId: string; // "chapter_0_c_tr"

  @Prop({ required: true })
  topicId: string; // "topic_0_1_c_tr"

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  order: number;

  @Prop({ required: true, enum: ['c', 'cpp'] })
  language: 'c' | 'cpp';

  @Prop({ required: true, enum: ['tr', 'en'] })
  locale: 'tr' | 'en';

  @Prop({ required: true, type: Array })
  content: LessonContent[]; // Zengin içerik dizisi

  @Prop({ type: [String], default: [] })
  prerequisites: string[]; // Hangi lesson'lar tamamlanmalı

  @Prop({ default: 0 })
  estimatedMinutes: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Object, default: {} })
  rewards: {
    xp: number;
  };

  @Prop({ type: [String], default: [] })
  objectives: string[]; // Öğrenme hedefleri

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: [String], default: [] })
  keywords: string[]; // Arama için

  // Navigasyon
  @Prop()
  previousLesson?: string;

  @Prop()
  nextLesson?: string;

  @Prop({ type: [String], default: [] })
  relatedLessons: string[];

  // İstatistikler
  @Prop({ default: 0 })
  viewCount: number;

  @Prop({ default: 0 })
  completionCount: number;

  @Prop({ default: 0 })
  averageRating: number;

  @Prop({ default: 0 })
  ratingCount: number;

  // Metadata
  @Prop({ default: false })
  isPremium: boolean;

  @Prop()
  authorId?: string;

  @Prop()
  lastUpdated?: Date;

  @Prop({ type: Object, default: {} })
  metadata: {
    totalQuestions?: number;
    totalCodeBlocks?: number;
    totalExercises?: number;
    hasVideo?: boolean;
    hasInteractive?: boolean;
    [key: string]: any;
  };
}

export const LessonSchema = SchemaFactory.createForClass(Lesson); 