import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Media } from './media.entity.js';
import { MediaService } from './media.service.js';
import { MediaController } from './media.controller.js';
import { FileModule } from '../file/file.module.js';
import { MediaConfigurableModule } from './media.module-definition.js';
import { AuthorizationModule } from '../authorization/authorization.module.js';
import { UserModule } from '../user/user.module.js';
import { MediaFileService } from './media-file.service.js';
import { ViewHistory } from './view-history/view-history.entity.js';
import { ViewHistoryService } from './view-history/view-history.service.js';
import { ViewHistoryController } from './view-history/view-history.controller.js';
import { MediaEntitySubscriber } from './media.entity.subscriber.js';
import { Series } from './series/series.entity.js';
import { SeriesTag } from './series/series-tag.entity.js';
import { SeriesSubscribe } from './series/series-subscribe.entity.js';
import { Episode } from './episode/episode.entity.js';
import { SeriesService } from './series/series.service.js';
import { EpisodeService } from './episode/episode.service.js';
import { SeriesSubscribeService } from './series/series-subscribe.service.js';
import { SeriesTagService } from './series/series-tag.service.js';
import { EpisodeController } from './episode/episode.controller.js';
import { SeriesSubscribeController } from './series/series-subscribe.controller.js';
import { SeriesTagController } from './series/series-tag.controller.js';
import { SeriesController } from './series/series.controller.js';
import { EpisodeEntitySubscriber } from './episode/episode.entity.subscriber.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Media, ViewHistory, Series, SeriesTag, SeriesSubscribe, Episode]),
    FileModule,
    AuthorizationModule,
    UserModule,
  ],
  providers: [
    MediaService,
    MediaFileService,
    ViewHistoryService,
    MediaEntitySubscriber,
    SeriesService,
    SeriesTagService,
    SeriesSubscribeService,
    EpisodeService,
    EpisodeEntitySubscriber,
  ],
  controllers: [
    ViewHistoryController,
    MediaController,
    SeriesTagController,
    SeriesSubscribeController,
    EpisodeController,
    SeriesController,
  ],
  exports: [
    MediaService,
    MediaFileService,
    ViewHistoryService,
    SeriesService,
    SeriesTagService,
    SeriesSubscribeService,
    EpisodeService,
  ],
})
export class MediaModule extends MediaConfigurableModule {
  declare static register: typeof MediaConfigurableModule.register;
  declare static registerAsync: typeof MediaConfigurableModule.registerAsync;
}
