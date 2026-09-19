import { IsObject, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class LangField {
  @IsString()
  en: string;

  @IsString()
  tr: string;
}

export class CreateSubjectDto {
  @ValidateNested()
  @Type(() => LangField)
  title: LangField;

  @ValidateNested()
  @Type(() => LangField)
  description: LangField;

  @ValidateNested()
  @Type(() => LangField)
  content: LangField;
} 