import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    description: '原密码',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MinLength(6)
  @MaxLength(40)
  old?: string;

  @ApiProperty({
    description: '新密码',
  })
  @IsString()
  @MinLength(6)
  @MaxLength(40)
  current: string;
}
