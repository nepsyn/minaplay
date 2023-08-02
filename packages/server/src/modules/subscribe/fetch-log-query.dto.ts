import { ApiQueryDto } from '../../utils/api.query.dto';
import { FetchLog } from './fetch-log.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class FetchLogQueryDto extends ApiQueryDto<FetchLog> {
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
