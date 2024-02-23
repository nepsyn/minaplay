import { Injectable, OnModuleInit } from '@nestjs/common';
import { ApplicationLogger } from '../../common/application.logger.service.js';
import { NotificationEventEnum, NotificationServiceEnum } from '../../enums/index.js';
import { NotificationEventMap } from './notification-event.interface.js';
import { User } from '../user/user.entity.js';
import { NotificationServiceAdapter } from './notification-service-adapter.interface.js';
import { DiscoveryService } from '@nestjs/core';
import { In, Like } from 'typeorm';
import { NotificationMetaService } from './notification-meta.service.js';

@Injectable()
export class NotificationService implements OnModuleInit {
  private logger = new ApplicationLogger(NotificationService.name);
  private adapters: Map<NotificationServiceEnum, NotificationServiceAdapter> = new Map();

  constructor(private discoveryService: DiscoveryService, private notificationMetaService: NotificationMetaService) {}

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
    const [metas] = await this.notificationMetaService.findAndCount({
      where: {
        events: Like(`%${event}%`),
        enabled: true,
        user: {
          id: to && In([].concat(to).map(({ id }) => id)),
          notify: true,
        },
      },
    });

    for (const meta of metas) {
      const adapter = this.getAdapter(meta.service);
      if (!adapter) {
        continue;
      }

      const config = meta.getConfig(adapter?.adapterConfigType());
      if (!config) {
        continue;
      }

      try {
        await adapter.notify(event, data, meta.userId, config);
      } catch (error) {
        this.logger.error('Emit notification error', error.stack, NotificationService.name);
      }
    }
  }
}
