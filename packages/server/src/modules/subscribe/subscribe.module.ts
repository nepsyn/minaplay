import { Module } from '@nestjs/common';
import { SubscribeController } from './subscribe.controller';
import { SubscribeSourceService } from './subscribe-source.service';
import { SubscribeSource } from './subscribe-source.entity';
import { SubscribeRule } from './subscribe-rule.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscribeFetchError } from './subscribe-fetch-error.entity';
import { SubscribeFetchErrorService } from './subscribe-fetch-error.service';
import { SubscribeDownloadItem } from './subscribe-download-item.entity';
import { SubscribeRuleService } from './subscribe-rule.service';
import { SubscribeDownloadItemService } from './subscribe-download-item.service';
import { BullModule } from '@nestjs/bull';
import { FetchSubscribeSourceConsumer } from './fetch-subscribe-source.consumer';
import { FileModule } from '../file/file.module';
import { SeriesModule } from '../series/series.module';
import { SubscribeRuleController } from './subscribe-rule.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([SubscribeSource, SubscribeRule, SubscribeFetchError, SubscribeDownloadItem]),
    BullModule.registerQueue({ name: 'fetch-subscribe-source' }),
    FileModule,
    SeriesModule,
  ],
  providers: [
    SubscribeSourceService,
    SubscribeRuleService,
    SubscribeFetchErrorService,
    SubscribeDownloadItemService,
    FetchSubscribeSourceConsumer,
  ],
  controllers: [SubscribeController, SubscribeRuleController],
  exports: [SubscribeSourceService, SubscribeRuleService, SubscribeFetchErrorService, SubscribeDownloadItemService],
})
export class SubscribeModule {}
