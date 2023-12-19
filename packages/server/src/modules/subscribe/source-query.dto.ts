import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';
import { Source } from './source.entity';
import { Transform } from 'class-transformer';
import { ApiQueryDto } from '../../common/api.query.dto';

export class SourceQueryDto extends ApiQueryDto<Source> {
  @ApiProperty({
    description: '查询关键字',
    required: false,
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({
    description: '是否启用',
    required: false,
    enum: [0, 1],
  })
  @Transform(({ value }) => Boolean(Number(value)))
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiProperty({
    description: '创建用户id',
    required: false,
  })
  @Transform(({ value }) => Number(value))
  @IsOptional()
  @IsInt()
  userId?: number;
}
