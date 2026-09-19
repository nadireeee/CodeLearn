import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CodeAnalysisDocument = CodeAnalysis & Document;

@Schema({ timestamps: true })
export class CodeAnalysis {
  @Prop({ required: true, type: String })
  userId: string;

  @Prop({ required: true })
  projectName: string;

  @Prop({ required: true })
  originalFileName: string;

  @Prop({ type: [Object] })
  files: Array<{
    name: string;
    path: string;
    content: string;
    language: string;
    size: number;
  }>;

  @Prop({ type: Object })
  analysis: {
    totalFiles: number;
    totalLines: number;
    languages: string[];
    complexity: number;
    issues: Array<{
      type: 'error' | 'warning' | 'info';
      message: string;
      file: string;
      line?: number;
      suggestion?: string;
    }>;
    suggestions: Array<{
      category: string;
      title: string;
      description: string;
      priority: 'low' | 'medium' | 'high';
      codeExample?: string;
    }>;
    metrics: {
      cyclomaticComplexity: number;
      maintainabilityIndex: number;
      codeDuplication: number;
      documentationCoverage: number;
    };
  };

  @Prop({ type: String })
  aiRecommendations: string;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}

export const CodeAnalysisSchema = SchemaFactory.createForClass(CodeAnalysis); 