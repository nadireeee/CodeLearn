import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserLessonProgressDocument = UserLessonProgress & Document;

@Schema({ timestamps: true })
export class UserLessonProgress {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true, enum: ['c', 'cpp'] })
  language: 'c' | 'cpp';

  @Prop({ required: true, enum: ['tr', 'en'] })
  locale: 'tr' | 'en';

  // Tamamlanan dersler
  @Prop({ type: [String], default: [] })
  completedLessons: string[];

  // Tamamlanan konular
  @Prop({ type: [String], default: [] })
  completedTopics: string[];

  // Tamamlanan bölümler
  @Prop({ type: [String], default: [] })
  completedChapters: string[];

  // Geçilen testler
  @Prop({ type: [String], default: [] })
  passedTests: string[];

  // Mevcut konum
  @Prop()
  currentChapter?: string;

  @Prop()
  currentTopic?: string;

  @Prop()
  currentLesson?: string;

  // İstatistikler
  @Prop({ default: 0 })
  totalXp: number;

  @Prop({ default: 0 })
  totalTimeSpent: number; // dakika

  @Prop({ default: 0 })
  currentStreak: number;

  @Prop({ default: 0 })
  longestStreak: number;

  @Prop()
  lastActivityDate?: Date;

  // Rozet bilgileri
  @Prop({ type: [String], default: [] })
  earnedBadges: string[];

  @Prop({ type: [String], default: [] })
  newBadges: string[]; // Yeni kazanılan rozetler

  // Test skorları
  @Prop({ type: Object, default: {} })
  testScores: { [testId: string]: number };

  // Ders tamamlama zamanları
  @Prop({ type: Object, default: {} })
  lessonCompletionTimes: { [lessonId: string]: Date };

  // Ders puanları
  @Prop({ type: Object, default: {} })
  lessonScores: { [lessonId: string]: number };

  // Favori dersler
  @Prop({ type: [String], default: [] })
  favoriteLessons: string[];

  // Notlar
  @Prop({ type: Object, default: {} })
  lessonNotes: { [lessonId: string]: string };

  // Ayarlar
  @Prop({ type: Object, default: {} })
  preferences: {
    autoplay?: boolean;
    showHints?: boolean;
    darkMode?: boolean;
    fontSize?: 'small' | 'medium' | 'large';
    codeTheme?: string;
  };
}

export const UserLessonProgressSchema = SchemaFactory.createForClass(UserLessonProgress); 