import { IsEnum, IsNotEmpty } from 'class-validator';

export enum VoteType {
  UP = 1,
  DOWN = -1
}

export class VoteDto {
  @IsEnum(VoteType)
  @IsNotEmpty()
  type: VoteType;
} 