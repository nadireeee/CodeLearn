import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BadgeDocument = Badge & Document;

@Schema({ timestamps: true })
export class Badge {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  icon: string;

  @Prop({ required: true })
  color: string;

  @Prop({ required: true })
  xpRequired: number;

  @Prop({ required: true })
  type: 'xp' | 'quiz_count' | 'streak' | 'perfect_score' | 'first_quiz' | 'question_solver' | 'project_creator';

  @Prop({ default: false })
  isUnlocked: boolean;

  @Prop()
  unlockedAt?: Date;
}

export const BadgeSchema = SchemaFactory.createForClass(Badge); 