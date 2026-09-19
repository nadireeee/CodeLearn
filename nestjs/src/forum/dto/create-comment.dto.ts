import { IsString, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  content: string;

  @IsString()
  @IsOptional()
  answerId?: string;
} 