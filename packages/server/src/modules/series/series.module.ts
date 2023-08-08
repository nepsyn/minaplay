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

@Module({
  imports: [TypeOrmModule.forFeature([Series, SeriesTag, Episode]), FileModule],
  providers: [SeriesService, SeriesTagService, EpisodeService],
  controllers: [SeriesController, SeriesTagController, EpisodeController],
  exports: [SeriesService, SeriesTagService, EpisodeService],
})
export class SeriesModule {}
