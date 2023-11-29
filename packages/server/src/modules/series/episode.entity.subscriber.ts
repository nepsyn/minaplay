import { DataSource, EntitySubscriberInterface, EventSubscriber, InsertEvent, IsNull, Not } from 'typeorm';
import { Episode } from './episode.entity';
import { instanceToPlain } from 'class-transformer';
import { NotificationGateway } from '../notification/notification.gateway';
import { PluginService } from '../plugin/plugin.service';
import { SeriesSubscribeService } from './series-subscribe.service';
import { EmailService } from '../notification/email.service';

@EventSubscriber()
export class EpisodeEntitySubscriber implements EntitySubscriberInterface<Episode> {
  constructor(
    dataSource: DataSource,
    private seriesSubscribeService: SeriesSubscribeService,
    private notificationGateway: NotificationGateway,
    private emailService: EmailService,
    private pluginService: PluginService,
  ) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return Episode;
  }

  async afterInsert(event: InsertEvent<Episode>) {
    await this.notificationGateway.notify('new-episode', {
      episode: instanceToPlain(event.entity) as Episode,
      time: new Date(),
    });
    await this.pluginService.emitAllEnabled('onNewEpisode', event.entity.id);

    if (event.entity.series) {
      const [subscribes] = await this.seriesSubscribeService.findAndCount({
        where: {
          seriesId: event.entity.series.id,
          notify: true,
          user: {
            email: Not(IsNull()),
            notify: true,
          },
        },
        relations: {
          user: true,
        },
      });
      if (subscribes.length > 0) {
        await this.emailService.notify(
          'new-episode',
          {
            episode: instanceToPlain(event.entity) as Episode,
            time: new Date(),
          },
          subscribes.map(({ user }) => String(user.email)),
        );
      }
    }
  }
}
