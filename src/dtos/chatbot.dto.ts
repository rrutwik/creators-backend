import { IsString, IsOptional, Length } from 'class-validator';

export class CreateChatBotDto {
  @IsString()
  @Length(1, 255)
  public name: string;

  @IsString()
  @Length(1, 2000)
  public prompt: string;
}

export class UpdateChatBotDto {
  @IsOptional()
  @IsString()
  @Length(1, 255)
  public name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 2000)
  public prompt?: string;
}
