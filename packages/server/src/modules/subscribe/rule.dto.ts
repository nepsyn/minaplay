import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class RuleDto {
  @ApiProperty({
    description: '代码规则',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20480)
  code: string;

  @ApiProperty({
    description: '订阅规则备注',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(60)
  remark?: string;

  @ApiProperty({
    description: '剧集id',
    required: false,
  })
  @IsOptional()
  @IsInt()
  seriesId?: number;

  @ApiProperty({
    description: '订阅源id',
    required: false,
  })
  @IsOptional()
  @IsInt()
  sourceId?: number;
}
