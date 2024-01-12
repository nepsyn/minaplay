import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class EpisodeDto {
  @ApiProperty({
    description: '单集标题',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(120)
  title?: string;

  @ApiProperty({
    description: '单集编号',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  no?: string;

  @ApiProperty({
    description: '发布时间',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  pubAt?: string;

  @ApiProperty({
    description: '所属剧集',
    required: false,
  })
  @IsInt()
  @IsOptional()
  seriesId?: number;

  @ApiProperty({
    description: '媒体id',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  mediaId?: string;
}
