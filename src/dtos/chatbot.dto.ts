import { IsString, IsOptional, Length, MIN_LENGTH, MinLength } from 'class-validator';

export class CreateChatBotDto {
  @IsString()
  @Length(1, 255)
  public name: string;

  @IsString()
  @Length(1, 2000)
  public prompt: string;
}

export class UpdateChatBotDto {
  @IsString()
  @MinLength(1)
  public name?: string;

  @IsString()
  @MinLength(1)
  public prompt?: string;
}
