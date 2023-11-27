import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Media } from './media.entity';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { FileModule } from '../file/file.module';
import { MediaConfigurableModule } from './media.module-definition';
import { AuthorizationModule } from '../authorization/authorization.module';
import { UserModule } from '../user/user.module';
import { MediaFileService } from './media-file.service';
import { ViewHistory } from './view-history.entity';
import { ViewHistoryService } from './view-history.service';
import { ViewHistoryController } from './view-history.controller';
import { MediaEntitySubscriber } from './media.entity.subscriber';

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
