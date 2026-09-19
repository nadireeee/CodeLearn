import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SubjectDocument = Subject & Document;

@Schema({ timestamps: true, collection: 'subjects' })
export class Subject {
  @Prop({ required: true, unique: true })
  id: string; // "0", "1", "2" etc.

  @Prop({ required: true })
  title: string; // "Bölüm 0 – Introduction / Getting Started"

  @Prop({ required: true })
  description: string;

  @Prop({ default: 0 })
  order: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: [String], default: [] })
  objectives: string[];

  @Prop({ default: 0 })
  totalLessons: number;

  @Prop({ default: 0 })
  totalTime: number; // dakika cinsinden
}

export const SubjectSchema = SchemaFactory.createForClass(Subject); 