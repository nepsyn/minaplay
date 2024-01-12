import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class SeriesSubscribeDto {
  @ApiProperty({
    description: '是否通知',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  notify?: boolean;
}
