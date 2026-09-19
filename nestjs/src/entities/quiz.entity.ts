import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

export type QuizDocument = Quiz & Document;

@Schema()
export class QuizQuestion {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true, enum: ['multiple-choice', 'matching', 'fill-in-the-blank', 'code-completion', 'output-prediction'] })
  type: string;

  @Prop({ required: true })
  question: string;

  @Prop({ type: [String] })
  options?: string[]; // multiple-choice için

  @Prop({ type: [{ left: String, right: String }] })
  pairs?: { left: string; right: string }[]; // matching için

  @Prop()
  codeTemplate?: string; // code-completion için

  @Prop({ required: true, type: MongooseSchema.Types.String })
  correctAnswer: string | number;

  @Prop({ required: true })
  explanation: string;

  @Prop({ default: 1 })
  points: number;

  @Prop({ type: [String] })
  hints?: string[];
}

export const QuizQuestionSchema = SchemaFactory.createForClass(QuizQuestion);

@Schema({ timestamps: true, collection: 'quizzes' })
export class Quiz {
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

  @Prop({ required: true, type: [QuizQuestionSchema] })
  questions: QuizQuestion[];

  @Prop({ default: false })
  isActive: boolean;

  @Prop({ default: 0 })
  totalAttempts: number;

  @Prop({ default: 0 })
  averageScore: number;

  @Prop({ default: 0 })
  perfectCompletions: number;
}

export const QuizSchema = SchemaFactory.createForClass(Quiz);

// Indexes for efficient queries
QuizSchema.index({ skillId: 1, subjectId: 1 });
QuizSchema.index({ isActive: 1 }); 