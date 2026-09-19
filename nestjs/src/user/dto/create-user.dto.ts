import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUrl, MinLength, IsIn } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  @MinLength(8)
  password?: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @IsString()
  @IsOptional()
  @IsIn(['tr', 'en'])
  language?: string;
}
