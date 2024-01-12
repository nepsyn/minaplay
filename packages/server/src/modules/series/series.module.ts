import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Series } from './series.entity.js';
import { SeriesService } from './series.service.js';
import { SeriesController } from './series.controller.js';
import { SeriesTag } from './series-tag.entity.js';
import { SeriesTagService } from './series-tag.service.js';
import { Episode } from './episode.entity.js';
import { EpisodeService } from './episode.service.js';
import { SeriesTagController } from './series-tag.controller.js';
import { EpisodeController } from './episode.controller.js';
import { FileModule } from '../file/file.module.js';
import { SeriesSubscribe } from './series-subscribe.entity.js';
import { SeriesSubscribeService } from './series-subscribe.service.js';
import { EpisodeEntitySubscriber } from './episode.entity.subscriber.js';
import { SeriesSubscribeController } from './series-subscribe.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Series, SeriesTag, SeriesSubscribe, Episode]), FileModule],
  providers: [SeriesService, SeriesTagService, SeriesSubscribeService, EpisodeService, EpisodeEntitySubscriber],
  controllers: [SeriesTagController, SeriesSubscribeController, EpisodeController, SeriesController],
  exports: [SeriesService, SeriesTagService, SeriesSubscribeService, EpisodeService],
})
export class SeriesModule {}
