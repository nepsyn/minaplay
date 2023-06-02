import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class LiveDto {
  @ApiProperty({
    description: '直播间标题',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  title?: string;

  @ApiProperty({
    description: '直播间密码',
    required: false,
  })
  @IsOptional()
  @IsString()
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
