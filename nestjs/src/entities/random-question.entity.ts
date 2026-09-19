import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RandomQuestionDocument = RandomQuestion & Document;

@Schema({ timestamps: true })
export class RandomQuestion {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, enum: ['c', 'cpp'] })
  language: 'c' | 'cpp';

  @Prop({ required: true, enum: ['beginner', 'intermediate', 'advanced'] })
  difficulty: 'beginner' | 'intermediate' | 'advanced';

  @Prop({ default: 'general' })
  topic: string;

  @Prop({ required: true })
  question: string;

  @Prop({ required: true })
  expectedAnswer: string;

  @Prop({ required: true })
  solutionCode: string;

  @Prop({ default: false })
  isAnswered: boolean;

  @Prop()
  userAnswer?: string;

  @Prop()
  evaluation?: string;

  @Prop([String])
  suggestions?: string[];

  @Prop()
  suggestedCode?: string;

  @Prop()
  answeredAt?: Date;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const RandomQuestionSchema = SchemaFactory.createForClass(RandomQuestion); 