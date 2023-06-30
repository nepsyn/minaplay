import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class RuleDto {
  @ApiProperty({
    description: '代码规则',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  code: string;

  @ApiProperty({
    description: '订阅规则备注',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(40)
  remark?: string;

  @ApiProperty({
    description: '订阅源id',
    required: false,
  })
  @IsOptional()
  @IsInt()
  sourceId?: number;

  @ApiProperty({
    description: '剧集id',
    required: false,
  })
  @IsOptional()
  @IsInt()
  seriesId?: number;
}
