import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional } from 'class-validator';

export class ViewHistoryDto {
  @ApiProperty({
    description: '进度',
    required: false,
  })
  @IsOptional()
  @IsInt()
  progress?: number;

  @ApiProperty({
    description: '单集id',
    required: false,
  })
  @IsOptional()
  @IsInt()
  episodeId?: number;
}
