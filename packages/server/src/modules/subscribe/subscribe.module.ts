import { Module } from '@nestjs/common';
import { SourceController } from './source.controller.js';
import { SourceService } from './source.service.js';
import { Source } from './source.entity.js';
import { Rule } from './rule.entity.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FetchLog } from './fetch-log.entity.js';
import { FetchLogService } from './fetch-log.service.js';
import { DownloadItem } from './download-item.entity.js';
import { RuleService } from './rule.service.js';
import { DownloadItemService } from './download-item.service.js';
import { BullModule } from '@nestjs/bull';
import { FetchSubscribeSourceConsumer } from './fetch-subscribe-source.consumer.js';
import { FileModule } from '../file/file.module.js';
import { SeriesModule } from '../series/series.module.js';
import { RuleController } from './rule.controller.js';
import { SubscribeConfigurableModule } from './subscribe.module-definition.js';
import { RuleErrorLogService } from './rule-error-log.service.js';
import { RuleErrorLog } from './rule-error-log.entity.js';
import { DownloadItemController } from './download-item.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Source, Rule, RuleErrorLog, FetchLog, DownloadItem]),
    BullModule.registerQueue({ name: 'fetch-subscribe-source' }),
    FileModule,
    SeriesModule,
  ],
  providers: [
    SourceService,
    RuleService,
    RuleErrorLogService,
    FetchLogService,
    DownloadItemService,
    FetchSubscribeSourceConsumer,
  ],
  controllers: [RuleController, DownloadItemController, SourceController],
  exports: [SourceService, RuleService, FetchLogService, DownloadItemService],
})
export class SubscribeModule extends SubscribeConfigurableModule {
  declare static register: typeof SubscribeConfigurableModule.register;
  declare static registerAsync: typeof SubscribeConfigurableModule.registerAsync;
}
