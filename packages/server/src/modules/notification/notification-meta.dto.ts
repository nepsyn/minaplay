import { NotificationEventEnum } from '../../enums/index.js';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class NotificationMetaDto {
  @ApiProperty({
    description: '是否启用',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  enabled: boolean;

  @ApiProperty({
    description: '订阅事件',
    required: false,
  })
  @IsEnum(NotificationEventEnum, {
    each: true,
  })
  @IsOptional()
  subscribes: NotificationEventEnum[];
}
