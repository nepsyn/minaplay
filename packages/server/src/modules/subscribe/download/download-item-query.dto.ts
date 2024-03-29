import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { StatusEnum } from '../../../enums/status.enum.js';
import { Transform } from 'class-transformer';
import { ApiQueryDto } from '../../../common/api.query.dto.js';
import { DownloadItem } from './download-item.entity.js';

export class DownloadItemQueryDto extends ApiQueryDto<DownloadItem> {
  @ApiProperty({
    description: '查询关键字',
    required: false,
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({
    description: '下载链接',
    required: false,
  })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiProperty({
    description: '订阅源id',
    required: false,
  })
  @Transform(({ value }) => Number(value))
  @IsOptional()
  @IsNumber()
  sourceId?: number;

  @ApiProperty({
    description: '订阅规则id',
    required: false,
  })
  @Transform(({ value }) => Number(value))
  @IsOptional()
  @IsNumber()
  ruleId?: number;

  @ApiProperty({
    description: '解析日志id',
    required: false,
  })
  @IsOptional()
  @IsString()
  logId?: string;

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

  @ApiProperty({
    description: '状态',
    required: false,
    enum: StatusEnum,
  })
  @IsOptional()
  @IsEnum(StatusEnum)
  status?: StatusEnum;
}
