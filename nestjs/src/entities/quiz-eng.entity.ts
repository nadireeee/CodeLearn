import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

export type QuizEngDocument = QuizEng & Document;

@Schema()
export class QuizEngQuestion {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true, enum: ['multiple-choice', 'matching', 'fill-in-the-blank', 'code-completion', 'output-prediction'] })
  type: string;

  @Prop({ required: true })
  question: string;

  @Prop({ type: [String] })
  options?: string[]; // for multiple-choice

  @Prop({ type: [{ left: String, right: String }] })
  pairs?: { left: string; right: string }[]; // for matching

  @Prop()
  codeTemplate?: string; // for code-completion

  @Prop({ required: true, type: MongooseSchema.Types.String })
  correctAnswer: string | number;

  @Prop({ required: true })
  explanation: string;

  @Prop({ default: 1 })
  points: number;

  @Prop({ type: [String] })
  hints?: string[];
}

export const QuizEngQuestionSchema = SchemaFactory.createForClass(QuizEngQuestion);

@Schema({ timestamps: true, collection: 'quizzes_eng' })
export class QuizEng {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  skillId: string;

  @Prop({ required: true })
  subjectId: string;

  @Prop({ required: true, enum: ['easy', 'medium', 'hard'] })
  difficulty: string;

  @Prop({ required: true })
  estimatedTime: number; // minutes

  @Prop({ required: true })
  xpReward: number;

  @Prop({ required: true, type: [QuizEngQuestionSchema] })
  questions: QuizEngQuestion[];

  @Prop({ default: false })
  isActive: boolean;

  @Prop({ default: 0 })
  totalAttempts: number;

  @Prop({ default: 0 })
  averageScore: number;

  @Prop({ default: 0 })
  perfectCompletions: number;
}

export const QuizEngSchema = SchemaFactory.createForClass(QuizEng);

// Indexes for efficient queries
QuizEngSchema.index({ skillId: 1, subjectId: 1 });
QuizEngSchema.index({ isActive: 1 }); 