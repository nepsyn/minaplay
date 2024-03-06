import { Injectable, OnModuleInit } from '@nestjs/common';
import { NotificationEventEnum, NotificationServiceEnum } from '../../enums/index.js';
import { NotificationEventMap } from './notification-event.interface.js';
import { User } from '../user/user.entity.js';
import { NotificationServiceAdapter } from './notification-service-adapter.interface.js';
import { DiscoveryService } from '@nestjs/core';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class NotificationService implements OnModuleInit {
  private adapters: Map<NotificationServiceEnum, NotificationServiceAdapter> = new Map();

  constructor(
    private discoveryService: DiscoveryService,
    @InjectQueue('notification') private notificationQueue: Queue,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async cleanNotificationJobs() {
    await this.notificationQueue.clean(0, 'completed');
    await this.notificationQueue.clean(0, 'failed');
  }

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
    await this.notificationQueue.add({ event, data, to }, { attempts: 2 });
  }
}
