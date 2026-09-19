import { IsOptional, IsString, IsNumber, IsEnum, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class LessonQueryDto {
  @IsOptional()
  @IsEnum(['c', 'cpp'])
  language?: 'c' | 'cpp';

  @IsOptional()
  @IsEnum(['tr', 'en'])
  locale?: 'tr' | 'en';

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(['beginner', 'intermediate', 'advanced'])
  difficulty?: 'beginner' | 'intermediate' | 'advanced';

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  chapterNumber?: number;

  @IsOptional()
  @IsString()
  chapterId?: string;

  @IsOptional()
  @IsString()
  topicId?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  hasVideo?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  hasQuiz?: boolean;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  limit?: number = 20;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  page?: number = 0;

  @IsOptional()
  @IsEnum(['newest', 'oldest', 'popular', 'difficulty', 'duration'])
  sortBy?: 'newest' | 'oldest' | 'popular' | 'difficulty' | 'duration' = 'newest';
} 