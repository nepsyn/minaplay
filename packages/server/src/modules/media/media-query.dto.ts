import { ApiQueryDto } from '../../utils/api.query.dto';
import { Media } from './media.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsOptional, IsString, IsUUID } from 'class-validator';

export class MediaQueryDto extends ApiQueryDto<Media> {
  @ApiProperty({
    description: '查询关键字',
    required: false,
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({
    description: '媒体文件id',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  id?: string;

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
