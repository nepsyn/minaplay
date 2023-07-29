import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class MediaDto {
  @ApiProperty({
    description: '剧集名称',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiProperty({
    description: '剧集描述',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  description?: string;

  @ApiProperty({
    description: '是否公开',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiProperty({
    description: '媒体文件id',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  fileId?: string;

  @ApiProperty({
    description: '海报文件id',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  posterFileId?: string;
}
