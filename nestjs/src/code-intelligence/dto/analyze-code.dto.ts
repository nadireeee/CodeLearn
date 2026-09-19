import { IsString, IsEnum, IsOptional, IsNumber } from 'class-validator';

export class AnalyzeCodeDto {
  @IsString()
  sessionId: string;

  @IsString()
  code: string;

  @IsEnum(['c', 'cpp'])
  language: 'c' | 'cpp';

  @IsOptional()
  @IsString()
  question?: string;

  @IsOptional()
  @IsString()
  expectedOutput?: string;

  @IsOptional()
  @IsNumber()
  currentLine?: number;
} 