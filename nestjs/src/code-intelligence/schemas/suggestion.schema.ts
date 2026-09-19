import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SuggestionDocument = Suggestion & Document;

@Schema({ timestamps: true })
export class Suggestion {
  _id: Types.ObjectId;

  @Prop({ required: true, type: String })
  userId: string;

  @Prop({ required: true, type: String })
  sessionId: string;

  @Prop({ required: true })
  code: string;

  @Prop({ required: true, enum: ['c', 'cpp'] })
  language: 'c' | 'cpp';

  @Prop({ required: true })
  type: 'completion' | 'error_fix' | 'optimization' | 'hint';

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: String })
  codeExample?: string;

  @Prop({ type: Number })
  line?: number;

  @Prop({ type: Number })
  cursorPosition?: number;

  @Prop({ type: String, enum: ['high', 'medium', 'low'], default: 'medium' })
  priority: 'high' | 'medium' | 'low';

  @Prop({ type: Boolean, default: false })
  isApplied: boolean;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}

export const SuggestionSchema = SchemaFactory.createForClass(Suggestion); 