import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TopicDocument = Topic & Document;

@Schema({ timestamps: true })
export class Topic {
  @Prop({ required: true, unique: true })
  id: string; // "topic_0_1_c_tr", "topic_0_2_cpp_en"

  @Prop({ required: true })
  chapterId: string; // "chapter_0_c_tr"

  @Prop({ required: true })
  title: string; // "Introduction to these tutorials"

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  order: number; // 1, 2, 3...

  @Prop({ required: true, enum: ['c', 'cpp'] })
  language: 'c' | 'cpp';

  @Prop({ required: true, enum: ['tr', 'en'] })
  locale: 'tr' | 'en';

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: [String], default: [] })
  prerequisites: string[]; // Hangi topic'ler tamamlanmalı

  @Prop({ default: 0 })
  totalLessons: number;

  @Prop({ default: 0 })
  estimatedMinutes: number;

  @Prop({ type: Object, default: {} })
  rewards: {
    xp: number;
    badge?: string;
  };

  @Prop({ default: 0 })
  viewCount: number;

  @Prop({ default: 0 })
  completionCount: number;
}

export const TopicSchema = SchemaFactory.createForClass(Topic); 