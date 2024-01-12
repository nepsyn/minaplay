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
import { ViewHistory } from './view-history.entity.js';
import { ViewHistoryService } from './view-history.service.js';
import { ViewHistoryController } from './view-history.controller.js';
import { MediaEntitySubscriber } from './media.entity.subscriber.js';

@Module({
  imports: [TypeOrmModule.forFeature([Media, ViewHistory]), FileModule, AuthorizationModule, UserModule],
  providers: [MediaService, MediaFileService, ViewHistoryService, MediaEntitySubscriber],
  controllers: [ViewHistoryController, MediaController],
  exports: [MediaService, MediaFileService, ViewHistoryService],
})
export class MediaModule extends MediaConfigurableModule {
  declare static register: typeof MediaConfigurableModule.register;
  declare static registerAsync: typeof MediaConfigurableModule.registerAsync;
}
