import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, FindManyOptions, FindOptionsWhere, Repository } from 'typeorm';
import { SeriesSubscribe } from './series-subscribe.entity';
import { NotificationService } from '../notification/notification.service';
import { EpisodeService } from './episode.service';
import { instanceToPlain } from 'class-transformer';
import { Episode } from './episode.entity';

@Injectable()
export class SeriesSubscribeService {
  constructor(
    @InjectRepository(SeriesSubscribe) private seriesSubscribeRepository: Repository<SeriesSubscribe>,
    private episodeService: EpisodeService,
    private notificationService: NotificationService,
  ) {}

  async save(subscribe: DeepPartial<SeriesSubscribe>) {
    return await this.seriesSubscribeRepository.save(subscribe);
  }

  async findOneBy(where: FindOptionsWhere<SeriesSubscribe>) {
    return await this.seriesSubscribeRepository.findOneBy(where);
  }

  async findAndCount(options?: FindManyOptions<SeriesSubscribe>) {
    return await this.seriesSubscribeRepository.findAndCount(options);
  }

  async delete(where: FindOptionsWhere<SeriesSubscribe>) {
    const result = await this.seriesSubscribeRepository.delete(where);
    return result.affected > 0;
  }

  async notifyUpdate(episodeId: number) {
    const episode = await this.episodeService.findOneBy({ id: episodeId });
    if (episode && episode.series) {
      const [subscribes] = await this.findAndCount({
        where: {
          series: { id: episode.series.id },
          notify: true,
        },
      });
      const subscribeUsers = subscribes.map(({ user }) => user);

      await this.notificationService.notify(
        'new-episode',
        {
          episode: instanceToPlain(episode) as Episode,
          time: new Date(),
        },
        subscribeUsers,
      );
    }
  }
}
