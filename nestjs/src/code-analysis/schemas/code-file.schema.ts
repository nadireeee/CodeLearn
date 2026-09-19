import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CodeFileDocument = CodeFile & Document;

@Schema({ timestamps: true })
export class CodeFile {
  @Prop({ required: true, type: String })
  userId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true, default: 'cpp' })
  language: string;

  @Prop({ type: Boolean, default: false })
  isActive: boolean;

  @Prop({ type: String })
  projectId?: string;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const CodeFileSchema = SchemaFactory.createForClass(CodeFile); 