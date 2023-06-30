import { ApiQueryDto } from '../../utils/api.query.dto';
import { FetchLog } from './fetch-log.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsEnum, IsOptional, IsString } from 'class-validator';
import { SubscribeDownloadItemStatusEnum } from '../../enums/subscribe-download-item-status.enum';

export class DownloadItemQueryDto extends ApiQueryDto<FetchLog> {
  @ApiProperty({
    description: '查询关键字',
    required: false,
  })
  @IsOptional()
  @IsString()
  keyword?: string;

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

  @ApiProperty({
    description: '结束时间',
    required: false,
  })
  @IsOptional()
  @IsEnum(SubscribeDownloadItemStatusEnum)
  status?: SubscribeDownloadItemStatusEnum;
}
