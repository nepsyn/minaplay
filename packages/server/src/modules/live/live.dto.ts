import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class LiveDto {
  @ApiProperty({
    description: '直播间标题',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  title?: string;

  @ApiProperty({
    description: '直播间密码',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(4)
  @MaxLength(16)
  password?: string;

  @ApiProperty({
    description: '直播间封面文件id',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  posterFileId?: string;
}
