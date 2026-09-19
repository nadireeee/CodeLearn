import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserProgressDocument = UserProgress & Document;

@Schema({ timestamps: true, collection: 'user_progress' })
export class UserProgress {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  lessonId: string;

  @Prop({ required: true })
  subjectId: string;

  @Prop({ default: false })
  isCompleted: boolean;

  @Prop({ default: 0 })
  score: number; // Quiz puanı

  @Prop({ default: 0 })
  timeSpent: number; // Dakika cinsinden

  @Prop({ default: Date.now })
  startedAt: Date;

  @Prop()
  completedAt?: Date;

  @Prop({ type: [String], default: [] })
  completedQuizzes: string[]; // Tamamlanan quiz ID'leri

  @Prop({ type: Object, default: {} })
  quizResults: {
    [quizId: string]: {
      score: number;
      answers: string[];
      correctAnswers: string[];
      completedAt: Date;
    };
  };

  @Prop({ default: 0 })
  attempts: number; // Kaç kez denenmiş
}

export const UserProgressSchema = SchemaFactory.createForClass(UserProgress);

// Compound index for efficient queries
UserProgressSchema.index({ userId: 1, lessonId: 1 }, { unique: true });
UserProgressSchema.index({ userId: 1, subjectId: 1 }); 