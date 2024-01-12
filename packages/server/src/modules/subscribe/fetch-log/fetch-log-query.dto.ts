import { FetchLog } from './fetch-log.entity.js';
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { StatusEnum } from '../../../enums/status.enum.js';
import { ApiQueryDto } from '../../../common/api.query.dto.js';

export class FetchLogQueryDto extends ApiQueryDto<FetchLog> {
  @ApiProperty({
    description: '状态',
    required: false,
    enum: StatusEnum,
  })
  @IsOptional()
  @IsEnum(StatusEnum)
  status?: StatusEnum;

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
