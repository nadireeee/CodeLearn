import { IsObject } from 'class-validator';
 
export class SavePreferencesDto {
  @IsObject()
  preferences: Record<string, any>;
} 