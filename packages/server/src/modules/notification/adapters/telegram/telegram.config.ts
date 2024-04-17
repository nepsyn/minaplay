import { IsString } from 'class-validator';

export class TelegramConfig {
  @IsString()
  token: string;

  @IsString()
  chatId: string;
}
