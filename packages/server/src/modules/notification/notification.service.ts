import { Injectable, OnModuleInit } from '@nestjs/common';
import { ApplicationLogger } from '../../common/application.logger.service.js';
import { NotificationEventEnum } from '../../enums/notification-event.enum.js';
import { NotificationEventMap } from './notification-event.interface.js';
import { User } from '../user/user.entity.js';
import { NotificationServiceAdapter } from './notification-service-adapter.interface.js';
import { DiscoveryService } from '@nestjs/core';
import { NotificationServiceEnum } from '../../enums/notification-service.enum.js';
import { In } from 'typeorm';
import { NotificationSubscribeService } from './notification-subscribe.service.js';

@Injectable()
export class NotificationService implements OnModuleInit {
  private logger = new ApplicationLogger(NotificationService.name);
  private adapters: Map<NotificationServiceEnum, NotificationServiceAdapter> = new Map();

  constructor(
    private discoveryService: DiscoveryService,
    private notificationSubscribeService: NotificationSubscribeService,
  ) {}

  getAdapter(type: NotificationServiceEnum) {
    return this.adapters.get(type);
  }

  get enabledAdapters() {
    return [...this.adapters.keys()];
  }

  async onModuleInit() {
    const enabledAdapters = this.discoveryService
      .getProviders()
      .map(({ instance }) => instance)
      .filter(
        (instance: NotificationServiceAdapter): instance is NotificationServiceAdapter =>
          instance?.adapterServiceType && instance?.notify && instance?.isEnabled(),
      );

    for (const adapter of enabledAdapters) {
      await adapter.init();
      this.adapters.set(adapter.adapterServiceType, adapter);
    }
  }

  async notify<T extends NotificationEventEnum>(event: T, data: NotificationEventMap[T], to?: User | User[]) {
    const [subscribes] = await this.notificationSubscribeService.findAndCount({
      where: {
        name: event,
        meta: {
          enabled: true,
          user: {
            id: to && In([].concat(to).map(({ id }) => id)),
            notify: true,
          },
        },
      },
    });

    for (const subscribe of subscribes) {
      const meta = await subscribe.meta;

      const adapter = this.getAdapter(meta.service);
      if (!adapter) {
        continue;
      }

      const config = meta.getConfig(adapter?.adapterConfigType());
      if (!config) {
        continue;
      }

      try {
        await adapter.notify(event, data, meta.user, config);
      } catch (error) {
        this.logger.error('Emit notification error', error.stack, NotificationService.name);
      }
    }
  }
}
