import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SeriesDto {
  @ApiProperty({
    description: '剧集名称',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiProperty({
    description: '是否完结',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  finished?: boolean;

  @ApiProperty({
    description: '季度',
    required: false,
  })
  @IsOptional()
  @IsNumberString()
  @MaxLength(20)
  season?: string;

  @ApiProperty({
    description: '发布时间',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  pubAt?: string;

  @ApiProperty({
    description: '完整单集数量',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  count?: number;

  @ApiProperty({
    description: '剧集描述',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  description?: string;

  @ApiProperty({
    description: '海报文件id',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  posterFileId?: string;

  @ApiProperty({
    description: '剧集标签',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({
    each: true,
  })
  tags?: string[];
}
