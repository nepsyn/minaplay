import { NotificationEventEnum } from '../../enums/notification-event.enum.js';
import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class NotificationSubscribeDto {
  @ApiProperty({
    description: '订阅事件',
    required: true,
  })
  @IsEnum(NotificationEventEnum, {
    each: true,
  })
  subscribes: NotificationEventEnum[];
}
