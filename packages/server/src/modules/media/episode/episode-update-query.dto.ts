import { ApiQueryDto } from '../../../common/api.query.dto.js';
import { Episode } from './episode.entity.js';
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class EpisodeUpdateQueryDto extends ApiQueryDto<Episode> {
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
