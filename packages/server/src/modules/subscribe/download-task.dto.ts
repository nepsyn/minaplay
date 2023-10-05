import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class DownloadTaskDto {
  @ApiProperty({
    description: '下载链接',
    required: false,
  })
  @IsString()
  url: string;
}
