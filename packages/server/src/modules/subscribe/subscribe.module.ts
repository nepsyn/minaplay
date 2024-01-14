import { Module } from '@nestjs/common';
import { SourceController } from './source/source.controller.js';
import { SourceService } from './source/source.service.js';
import { Source } from './source/source.entity.js';
import { Rule } from './rule/rule.entity.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RuleService } from './rule/rule.service.js';
import { BullModule } from '@nestjs/bull';
import { FileModule } from '../file/file.module.js';
import { RuleController } from './rule/rule.controller.js';
import { SubscribeConfigurableModule } from './subscribe.module-definition.js';
import { RuleErrorLogService } from './rule/rule-error-log.service.js';
import { RuleErrorLog } from './rule/rule-error-log.entity.js';
import { ParseLog } from './parse-log/parse-log.entity.js';
import { ParseLogService } from './parse-log/parse-log.service.js';
import { ParseSourceConsumer } from './parse-source.consumer.js';
import { DownloadItem } from './download/download-item.entity.js';
import { DownloadService } from './download/download.service.js';
import { DownloadItemController } from './download/download-item.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Source, Rule, RuleErrorLog, ParseLog, DownloadItem]),
    BullModule.registerQueue({ name: 'parse-source' }),
    FileModule,
  ],
  providers: [SourceService, RuleService, RuleErrorLogService, ParseLogService, DownloadService, ParseSourceConsumer],
  controllers: [RuleController, SourceController, DownloadItemController],
  exports: [SourceService, RuleService, RuleErrorLogService, ParseLogService, DownloadService],
})
export class SubscribeModule extends SubscribeConfigurableModule {
  declare static register: typeof SubscribeConfigurableModule.register;
  declare static registerAsync: typeof SubscribeConfigurableModule.registerAsync;
}
