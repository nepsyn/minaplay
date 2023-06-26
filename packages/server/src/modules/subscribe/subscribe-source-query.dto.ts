import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { ApiQueryDto } from '../../utils/api.query.dto';
import { SubscribeSource } from './subscribe-source.entity';
import { Transform } from 'class-transformer';

export class SubscribeSourceQueryDto extends ApiQueryDto<SubscribeSource> {
  @ApiProperty({
    description: '查询关键字',
    required: false,
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({
    description: '订阅源id',
    required: false,
  })
  @Transform(({ value }) => Number(value))
  @IsOptional()
  @IsInt()
  id?: number;

  @ApiProperty({
    description: '订阅源url',
    required: false,
  })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiProperty({
    description: '创建用户id',
    required: false,
  })
  @Transform(({ value }) => Number(value))
  @IsOptional()
  @IsInt()
  userId?: number;
}
