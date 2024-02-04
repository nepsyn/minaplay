import { IsEmail } from 'class-validator';

export class EmailConfig {
  @IsEmail()
  address: string;
}
