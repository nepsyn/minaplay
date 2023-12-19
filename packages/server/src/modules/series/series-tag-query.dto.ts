import { SeriesTag } from './series-tag.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { ApiQueryDto } from '../../common/api.query.dto';

export class SeriesTagQueryDto extends ApiQueryDto<SeriesTag> {
  @ApiProperty({
    description: '查询关键字',
    required: false,
  })
  @IsOptional()
  @IsString()
  keyword?: string;
}
