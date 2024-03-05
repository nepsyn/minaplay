import { Injectable } from '@nestjs/common';
import { Process, Processor } from '@nestjs/bull';
import { NotificationService } from './notification.service.js';
import { Job } from 'bull';
import { NotificationEventEnum } from '../../enums/index.js';
import { NotificationEventMap } from './notification-event.interface.js';
import { User } from '../user/user.entity.js';
import { In, Like } from 'typeorm';
import { NotificationMetaService } from './notification-meta.service.js';
import { ApplicationLogger } from '../../common/application.logger.service.js';

interface NotificationData<T extends NotificationEventEnum = NotificationEventEnum> {
  event: T;
  data: NotificationEventMap[T];
  to?: User | User[];
}

@Injectable()
@Processor('notification')
export class NotificationConsumer {
  private logger = new ApplicationLogger(NotificationConsumer.name);

  constructor(
    private notificationService: NotificationService,
    private notificationMetaService: NotificationMetaService,
  ) {}

  @Process()
  async sendNotification(job: Job<NotificationData>) {
    const { event, data, to } = job.data;

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
      const adapter = this.notificationService.getAdapter(meta.service);
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
        this.logger.error('Emit notification error', error.stack, NotificationConsumer.name);
      }
    }
  }
}
