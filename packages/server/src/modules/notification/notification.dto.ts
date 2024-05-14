import { IsEnum, IsObject } from 'class-validator';
import { NotificationServiceEnum } from '../../enums/index.js';
import { ApiProperty } from '@nestjs/swagger';

export class NotificationDto {
  @ApiProperty({
    description: '通知服务',
    enum: NotificationServiceEnum,
  })
  @IsEnum(NotificationServiceEnum)
  service: NotificationServiceEnum;

  @ApiProperty({
    description: '通知服务配置',
  })
  @IsObject()
  config: object;
}
