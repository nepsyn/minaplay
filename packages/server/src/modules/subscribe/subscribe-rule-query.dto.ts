import { ApiQueryDto } from '../../utils/api.query.dto';
import { SubscribeRule } from './subscribe-rule.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class SubscribeRuleQueryDto extends ApiQueryDto<SubscribeRule> {
  @ApiProperty({
    description: '查询关键字',
    required: false,
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({
    description: '订阅规则id',
    required: false,
  })
  @Transform(({ value }) => Number(value))
  @IsOptional()
  @IsInt()
  id?: number;

  @ApiProperty({
    description: '订阅源id',
    required: false,
  })
  @Transform(({ value }) => Number(value))
  @IsOptional()
  @IsInt()
  sourceId?: number;

  @ApiProperty({
    description: '剧集',
    required: false,
  })
  @Transform(({ value }) => Number(value))
  @IsOptional()
  @IsInt()
  seriesId?: number;
}
