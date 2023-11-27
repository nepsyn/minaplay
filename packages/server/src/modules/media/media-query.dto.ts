import { ApiQueryDto } from '../../utils/api.query.dto';
import { Media } from './media.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class MediaQueryDto extends ApiQueryDto<Media> {
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
