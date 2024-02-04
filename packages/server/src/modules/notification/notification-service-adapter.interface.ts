import { NotificationEventMap } from './notification-event.interface.js';
import { User } from '../user/user.entity.js';
import { NotificationEventEnum } from '../../enums/notification-event.enum.js';
import { Type } from '@nestjs/common';
import { NotificationServiceEnum } from '../../enums/notification-service.enum.js';

export interface NotificationServiceAdapter<Config extends object = object> {
  adapterServiceType: NotificationServiceEnum;

  isEnabled(): boolean;

  init(): any;

  notify<T extends NotificationEventEnum>(event: T, data: NotificationEventMap[T], user: User, config: Config): any;

  adapterConfigType(): Type<Config>;
}
