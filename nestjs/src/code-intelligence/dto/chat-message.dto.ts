import { IsString, IsEnum, IsOptional } from 'class-validator';

export class ChatMessageDto {
  @IsString()
  sessionId: string;

  @IsString()
  message: string;

  @IsString()
  code: string;

  @IsEnum(['c', 'cpp'])
  language: 'c' | 'cpp';

  @IsOptional()
  @IsString()
  question?: string;
} 