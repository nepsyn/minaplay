import { ApiQueryDto } from '../../utils/api.query.dto';
import { FetchLog } from './fetch-log.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsOptional } from 'class-validator';

export class FetchLogQueryDto extends ApiQueryDto<FetchLog> {
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
