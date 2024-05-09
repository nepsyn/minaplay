import { NotificationEventMap } from './notification-event.interface.js';
import { NotificationEventEnum, NotificationServiceEnum } from '../../enums/index.js';
import { Type } from '@nestjs/common';
import { User } from '../user/user.entity.js';

export interface NotificationServiceAdapter<Config extends object = object> {
  adapterServiceType: NotificationServiceEnum;
  adapterConfigType: Type<Config>;

  isEnabled(): boolean;

  init(): any;

  notify<T extends NotificationEventEnum>(event: T, data: NotificationEventMap[T], userId: number, config: Config): any;

  test(user: User, config: Config): any;
}
