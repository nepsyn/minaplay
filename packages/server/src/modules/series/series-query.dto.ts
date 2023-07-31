import { ApiQueryDto } from '../../utils/api.query.dto';
import { Series } from './series.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsInt, IsOptional, IsString } from 'class-validator';
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
    description: '剧集ID',
    required: false,
  })
  @Transform(({ value }) => Number(value))
  @IsOptional()
  @IsString()
  id?: number;

  @ApiProperty({
    description: '剧集名称',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: '创建用户id',
    required: false,
  })
  @Transform(({ value }) => Number(value))
  @IsOptional()
  @IsInt()
  userId?: number;

  @ApiProperty({
    description: '开始时间',
    required: false,
  })
  @IsOptional()
  @IsDate()
  start?: Date;

  @ApiProperty({
    description: '结束时间',
    required: false,
  })
  @IsOptional()
  @IsDate()
  end?: Date;
}
