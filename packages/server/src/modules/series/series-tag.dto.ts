import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SeriesTagDto {
  @ApiProperty({
    description: '剧集标签名称',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  name?: string;
}
