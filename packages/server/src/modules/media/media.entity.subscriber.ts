import { DataSource, EntitySubscriberInterface, EventSubscriber, InsertEvent } from 'typeorm';
import { NotificationGateway } from '../notification/notification.gateway.js';
import { PluginService } from '../plugin/plugin.service.js';
import { Media } from './media.entity.js';
import { instanceToPlain } from 'class-transformer';

@EventSubscriber()
export class MediaEntitySubscriber implements EntitySubscriberInterface<Media> {
  constructor(
    dataSource: DataSource,
    private notificationGateway: NotificationGateway,
    private pluginService: PluginService,
  ) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return Media;
  }

  async afterInsert(event: InsertEvent<Media>) {
    await this.notificationGateway.notify('new-media', {
      media: instanceToPlain(event.entity) as Media,
      time: new Date(),
    });
    await this.pluginService.emitAllEnabled('onNewMedia', event.entity.id);
  }
}
