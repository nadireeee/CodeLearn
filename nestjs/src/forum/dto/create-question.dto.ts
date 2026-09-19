import { IsString, IsNotEmpty, IsOptional, IsArray, IsEnum, MaxLength, MinLength } from 'class-validator';

export enum QuestionCategory {
  C = 'C',
  CPP = 'C++'
}

export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(255)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(20)
  content: string;

  @IsEnum(QuestionCategory)
  @IsNotEmpty()
  category: QuestionCategory;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  tags?: string[];
} 