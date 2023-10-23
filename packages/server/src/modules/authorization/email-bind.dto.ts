import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class EmailBindDto {
  @ApiProperty({
    description: '邮箱地址',
  })
  @IsEmail()
  email: string;
}
