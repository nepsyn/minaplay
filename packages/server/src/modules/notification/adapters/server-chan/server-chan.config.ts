import { IsString } from 'class-validator';

export class ServerChanConfig {
  @IsString()
  token: string;
}
