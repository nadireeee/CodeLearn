import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CodeSessionDocument = CodeSession & Document;

@Schema({ timestamps: true, suppressReservedKeysWarning: true })
export class CodeSession {
  _id: Types.ObjectId;

  @Prop({ required: true, type: String })
  userId: string;

  @Prop({ required: true, type: String })
  sessionId: string;

  @Prop({ required: true })
  code: string;

  @Prop({ required: true, enum: ['c', 'cpp'] })
  language: 'c' | 'cpp';

  @Prop({ type: String })
  question?: string;

  @Prop({ type: String })
  expectedOutput?: string;

  @Prop({ type: Number, default: 0 })
  currentLine: number;

  @Prop({ type: Object })
  analysis: {
    quality: number;
    analysis?: string;
    issues: Array<{
      type: 'error' | 'warning' | 'info';
      line: number;
      message: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      suggestion?: string;
    }>;
    suggestions: Array<{
      type: 'optimization' | 'refactoring' | 'best_practice' | 'style';
      title: string;
      description: string;
      impact: 'low' | 'medium' | 'high';
      effort: 'low' | 'medium' | 'high';
      code?: string;
    }>;
    complexity: number;
    maintainability: number;
    performance: number;
    security: number;
  };

  @Prop({ type: [Object] })
  codeErrors: Array<{
    type: 'syntax' | 'logic' | 'runtime';
    line: number;
    message: string;
    severity: 'error' | 'warning' | 'info';
    suggestion: string;
  }>;

  @Prop({ type: [String] })
  hints: string[];

  @Prop({ type: Boolean, default: true })
  isOnTrack: boolean;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const CodeSessionSchema = SchemaFactory.createForClass(CodeSession); 