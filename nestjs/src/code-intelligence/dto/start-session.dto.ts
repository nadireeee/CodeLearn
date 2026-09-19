import { IsString, IsEnum, IsOptional } from 'class-validator';

export class StartSessionDto {
  @IsString()
  sessionId: string;

  @IsEnum(['c', 'cpp'])
  language: 'c' | 'cpp';

  @IsOptional()
  @IsString()
  question?: string;
} 