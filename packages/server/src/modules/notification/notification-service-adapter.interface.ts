import { NotificationEventMap } from './notification-event.interface.js';
import { NotificationEventEnum, NotificationServiceEnum } from '../../enums/index.js';
import { Type } from '@nestjs/common';

export interface NotificationServiceAdapter<Config extends object = object> {
  adapterServiceType: NotificationServiceEnum;

  isEnabled(): boolean;

  init(): any;

  notify<T extends NotificationEventEnum>(event: T, data: NotificationEventMap[T], userId: number, config: Config): any;

  adapterConfigType(): Type<Config>;
}
