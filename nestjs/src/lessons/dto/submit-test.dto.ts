import { IsString, IsArray, IsEnum, IsNumber } from 'class-validator';

export class SubmitTestDto {
  @IsString()
  testId: string;

  @IsEnum(['c', 'cpp'])
  language: 'c' | 'cpp';

  @IsEnum(['tr', 'en'])
  locale: 'tr' | 'en';

  @IsArray()
  @IsNumber({}, { each: true })
  answers: number[];
} 