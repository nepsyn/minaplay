import { DataSource, EntitySubscriberInterface, EventSubscriber, InsertEvent } from 'typeorm';
import { Media } from './media.entity.js';
import { NotificationService } from '../notification/notification.service.js';
import { NotificationEventEnum } from '../../enums/index.js';

@EventSubscriber()
export class MediaEntitySubscriber implements EntitySubscriberInterface<Media> {
  constructor(dataSource: DataSource, private notificationService: NotificationService) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return Media;
  }

  async afterInsert(event: InsertEvent<Media>) {
    await this.notificationService.notify(NotificationEventEnum.NEW_MEDIA, {
      media: await event.manager.getRepository(Media).findOneBy({ id: event.entity.id }),
      time: new Date(),
    });
  }
}
