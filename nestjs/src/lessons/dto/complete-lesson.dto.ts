import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';

export class CompleteLessonDto {
  @IsString()
  lessonId: string;

  @IsEnum(['c', 'cpp'])
  language: 'c' | 'cpp';

  @IsEnum(['tr', 'en'])
  locale: 'tr' | 'en';

  @IsOptional()
  @IsNumber()
  timeSpent?: number; // dakika

  @IsOptional()
  @IsNumber()
  score?: number; // 0-100

  @IsOptional()
  @IsNumber()
  exercisesCompleted?: number;

  @IsOptional()
  @IsNumber()
  quizzesCompleted?: number;

  @IsOptional()
  @IsString()
  notes?: string;
} 