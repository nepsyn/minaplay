import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: '用户名',
  })
  @IsString()
  username: string;

  @ApiProperty({
    description: '密码',
  })
  @IsString()
  password: string;
}
