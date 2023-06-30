import { Module } from '@nestjs/common';
import { SourceController } from './source.controller';
import { SourceService } from './source.service';
import { Source } from './source.entity';
import { Rule } from './rule.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FetchLog } from './fetch-log.entity';
import { FetchLogService } from './fetch-log.service';
import { DownloadItem } from './download-item.entity';
import { RuleService } from './rule.service';
import { DownloadItemService } from './download-item.service';
import { BullModule } from '@nestjs/bull';
import { FetchSubscribeSourceConsumer } from './fetch-subscribe-source.consumer';
import { FileModule } from '../file/file.module';
import { SeriesModule } from '../series/series.module';
import { RuleController } from './rule.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Source, Rule, FetchLog, DownloadItem]),
    BullModule.registerQueue({ name: 'fetch-subscribe-source' }),
    FileModule,
    SeriesModule,
  ],
  providers: [SourceService, RuleService, FetchLogService, DownloadItemService, FetchSubscribeSourceConsumer],
  controllers: [SourceController, RuleController],
  exports: [SourceService, RuleService, FetchLogService, DownloadItemService],
})
export class SubscribeModule {}
