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
import { SubscribeConfigurableModule } from './subscribe.module-definition';
import { RuleErrorLogService } from './rule-error-log.service';
import { RuleErrorLog } from './rule-error-log.entity';

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
  controllers: [RuleController, SourceController],
  exports: [SourceService, RuleService, FetchLogService, DownloadItemService],
})
export class SubscribeModule extends SubscribeConfigurableModule {
  declare static register: typeof SubscribeConfigurableModule.register;
  declare static registerAsync: typeof SubscribeConfigurableModule.registerAsync;
}
