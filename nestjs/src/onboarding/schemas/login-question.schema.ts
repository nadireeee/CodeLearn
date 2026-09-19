import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LoginQuestionDocument = LoginQuestion & Document;

@Schema()
class QuestionOption {
  @Prop({ required: true })
  label: string;

  @Prop({ required: true })
  value: string;
}

const QuestionOptionSchema = SchemaFactory.createForClass(QuestionOption);

@Schema({ collection: 'login_questions', timestamps: true })
export class LoginQuestion {
  @Prop({ required: true, trim: true })
  text: string;

  @Prop({ type: [QuestionOptionSchema], required: true })
  options: QuestionOption[];

  @Prop({ required: true, unique: true })
  key: string;
}

export const LoginQuestionSchema = SchemaFactory.createForClass(LoginQuestion); 