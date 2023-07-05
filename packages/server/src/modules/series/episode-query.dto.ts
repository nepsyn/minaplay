import { ApiQueryDto } from '../../utils/api.query.dto';
import { Episode } from './episode.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class EpisodeQueryDto extends ApiQueryDto<Episode> {
  @ApiProperty({
    description: '剧集id',
    required: false,
  })
  @Transform(({ value }) => Number(value))
  @IsOptional()
  @IsInt()
  seriesId?: number;
}
