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
}
