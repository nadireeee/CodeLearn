import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

export type QuizProgressDocument = QuizProgress & Document;

@Schema()
export class QuizAnswer {
  @Prop({ required: true })
  questionId: string;

  @Prop({ required: true, type: MongooseSchema.Types.Mixed })
  userAnswer: string | number;

  @Prop({ required: true, type: MongooseSchema.Types.Mixed })
  correctAnswer: string | number;

  @Prop({ required: true })
  isCorrect: boolean;

  @Prop({ required: true })
  timeSpent: number; // seconds

  @Prop()
  hintsUsed: number;
}

export const QuizAnswerSchema = SchemaFactory.createForClass(QuizAnswer);

@Schema({ timestamps: true, collection: 'quiz_progress' })
export class QuizProgress {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  quizId: string;

  @Prop({ required: true })
  skillId: string;

  @Prop({ required: true })
  subjectId: string;

  @Prop({ default: false })
  isCompleted: boolean;

  @Prop({ default: 0 })
  score: number;

  @Prop({ default: 0 })
  totalScore: number;

  @Prop({ default: 0 })
  correctAnswers: number;

  @Prop({ default: 0 })
  totalQuestions: number;

  @Prop({ default: 0 })
  timeSpent: number; // seconds

  @Prop({ default: 0 })
  xpEarned: number;

  @Prop({ default: 0 })
  heartsUsed: number;

  @Prop({ default: 0 })
  streak: number;

  @Prop({ type: [QuizAnswerSchema] })
  answers: QuizAnswer[];

  @Prop()
  startedAt: Date;

  @Prop()
  completedAt?: Date;

  @Prop({ default: 1 })
  attempts: number;

  @Prop({ default: false })
  isPerfect: boolean;

  @Prop({ type: [String], default: [] })
  newlyAwardedBadges: string[];
}

export const QuizProgressSchema = SchemaFactory.createForClass(QuizProgress);

// Compound indexes
QuizProgressSchema.index({ userId: 1, quizId: 1 }, { unique: true });
QuizProgressSchema.index({ userId: 1, skillId: 1 });
QuizProgressSchema.index({ userId: 1, subjectId: 1 }); 
QuizProgressSchema.index({ userId: 1, quizId: 1 }, { unique: true });
QuizProgressSchema.index({ userId: 1, skillId: 1 });
QuizProgressSchema.index({ userId: 1, subjectId: 1 }); 