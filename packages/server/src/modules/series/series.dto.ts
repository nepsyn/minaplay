import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class SeriesDto {
  @ApiProperty({
    description: '剧集名称',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiProperty({
    description: '海报文件id',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  posterFileId?: string;

  @ApiProperty({
    description: '剧集描述',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(600)
  description?: string;

  @ApiProperty({
    description: '剧集标签',
    required: false,
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  tagIds?: number[];
}
