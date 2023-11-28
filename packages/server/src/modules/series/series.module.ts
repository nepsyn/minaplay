import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Series } from './series.entity';
import { SeriesService } from './series.service';
import { SeriesController } from './series.controller';
import { SeriesTag } from './series-tag.entity';
import { SeriesTagService } from './series-tag.service';
import { Episode } from './episode.entity';
import { EpisodeService } from './episode.service';
import { SeriesTagController } from './series-tag.controller';
import { EpisodeController } from './episode.controller';
import { FileModule } from '../file/file.module';
import { SeriesSubscribe } from './series-subscribe.entity';
import { SeriesSubscribeService } from './series-subscribe.service';
import { EpisodeEntitySubscriber } from './episode.entity.subscriber';
import { SeriesSubscribeController } from './series-subscribe.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Series, SeriesTag, SeriesSubscribe, Episode]), FileModule],
  providers: [SeriesService, SeriesTagService, SeriesSubscribeService, EpisodeService, EpisodeEntitySubscriber],
  controllers: [SeriesTagController, EpisodeController, SeriesController, SeriesSubscribeController],
  exports: [SeriesService, SeriesTagService, SeriesSubscribeService, EpisodeService],
})
export class SeriesModule {}
