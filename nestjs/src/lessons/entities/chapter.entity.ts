import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ChapterDocument = Chapter & Document;

@Schema({ timestamps: true })
export class Chapter {
  @Prop({ required: true, default: 'chapter' })
  entityType: string; // 'chapter', 'topic', 'lesson', 'chapterTest', 'userLessonProgress'

  @Prop({ required: true, unique: true })
  id: string; // "chapter_0_c_tr", "chapter_1_cpp_en"

  @Prop({ required: true })
  title: string; // "Introduction / Getting Started"

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  order: number; // 0, 1, 2...

  @Prop({ required: true, enum: ['c', 'cpp'] })
  language: 'c' | 'cpp';

  @Prop({ required: true, enum: ['tr', 'en'] })
  locale: 'tr' | 'en';

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: [String], default: [] })
  prerequisites: string[]; // Hangi chapter'lar tamamlanmalı

  @Prop({ default: 0 })
  totalTopics: number;

  @Prop({ default: 0 })
  estimatedHours: number;

  @Prop()
  icon?: string; // 🚀, 📚, 🔄

  @Prop()
  color?: string; // #4F46E5, #059669

  @Prop({ type: Object, default: {} })
  rewards: {
    xp: number;
    badge?: string;
    title?: string;
  };

  @Prop({ default: 0 })
  viewCount: number;

  @Prop({ default: 0 })
  completionCount: number;
}

export const ChapterSchema = SchemaFactory.createForClass(Chapter); 