import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class SourceDto {
  @ApiProperty({
    description: '订阅源 url',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  url?: string;

  @ApiProperty({
    description: '订阅源标题',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(40)
  title?: string;

  @ApiProperty({
    description: '订阅源备注',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(40)
  remark?: string;

  @ApiProperty({
    description: '更新周期 cron 表达式',
    required: false,
    default: '0 */30 * * * *',
  })
  @IsString()
  @IsOptional()
  cron?: string;

  @ApiProperty({
    description: '是否启用',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}
