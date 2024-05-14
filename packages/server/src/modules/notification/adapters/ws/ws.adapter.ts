import { NotificationServiceAdapter } from '../../notification-service-adapter.interface.js';
import { WsConfig } from './ws.config.js';
import { Inject, Injectable } from '@nestjs/common';
import { NotificationEventEnum, NotificationServiceEnum } from '../../../../enums/index.js';
import { NotificationEventMap } from '../../notification-event.interface.js';
import { ApplicationLogger } from '../../../../common/application.logger.service.js';
import { NotificationGateway } from './notification.gateway.js';
import { instanceToPlain } from 'class-transformer';
import { NOTIFICATION_MODULE_OPTIONS_TOKEN } from '../../notification.module-definition.js';
import { NotificationModuleOptions } from '../../notification.module.interface.js';
import { User } from '../../../user/user.entity.js';

@Injectable()
export class WsAdapter implements NotificationServiceAdapter<WsConfig> {
  private logger = new ApplicationLogger(WsAdapter.name);

  constructor(
    @Inject(NOTIFICATION_MODULE_OPTIONS_TOKEN) private options: NotificationModuleOptions,
    private notificationGateway: NotificationGateway,
  ) {}

  adapterServiceType = NotificationServiceEnum.WS;

  adapterConfigType = WsConfig;

  isEnabled() {
    return this.options.wsEnabled;
  }

  init() {
    this.logger.log('Ws notification service is running');
  }

  notify<T extends NotificationEventEnum>(event: T, data: NotificationEventMap[T], userId: number, _config: WsConfig) {
    this.notificationGateway.server.to(userId.toString()).emit(event, instanceToPlain(data));
  }

  async test(user: User, _config: WsConfig) {
    this.notificationGateway.server
      .to(user.id.toString())
      .emit('test', { message: `Hello ${user.username}, this is a message from MinaPlay notification service!` });
  }
}
