import { ApiQueryDto } from '../../utils/api.query.dto';
import { Series } from './series.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsInt, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class SeriesQueryDto extends ApiQueryDto<Series> {
  @ApiProperty({
    description: '查询关键字',
    required: false,
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({
    description: '剧集名称',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: '剧集季度',
    required: false,
  })
  @IsOptional()
  @IsString()
  season?: string;

  @ApiProperty({
    description: '是否完结',
    required: false,
    enum: [0, 1],
  })
  @Transform(({ value }) => Boolean(Number(value)))
  @IsOptional()
  @IsBoolean()
  finished?: boolean;

  @ApiProperty({
    description: '创建用户id',
    required: false,
  })
  @Transform(({ value }) => Number(value))
  @IsOptional()
  @IsInt()
  userId?: number;

  @ApiProperty({
    description: '剧集标签',
    required: false,
  })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiProperty({
    description: '开始时间',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  start?: string;

  @ApiProperty({
    description: '结束时间',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  end?: string;
}
