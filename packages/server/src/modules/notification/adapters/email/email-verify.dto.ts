import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class EmailVerifyDto {
  @ApiProperty({
    description: '验证 KEY',
  })
  @IsString()
  key: string;

  @ApiProperty({
    description: '验证码',
  })
  @IsString()
  code: string;
}
