import { DataSource, EntitySubscriberInterface, EventSubscriber, InsertEvent } from 'typeorm';
import { Episode } from './episode.entity.js';
import { NotificationService } from '../../notification/notification.service.js';
import { NotificationEventEnum } from '../../../enums/notification-event.enum.js';

@EventSubscriber()
export class EpisodeEntitySubscriber implements EntitySubscriberInterface<Episode> {
  constructor(dataSource: DataSource, private notificationService: NotificationService) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return Episode;
  }

  async afterInsert(event: InsertEvent<Episode>) {
    await this.notificationService.notify(NotificationEventEnum.NEW_EPISODE, {
      episode: event.entity,
      time: new Date(),
    });
  }
}
