import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class DownloadTaskDto {
  @ApiProperty({
    description: '下载链接',
  })
  @IsString()
  url: string;

  @ApiProperty({
    description: '下载项目标题',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @ApiProperty({
    description: '订阅源ID',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  sourceId?: number;
}
