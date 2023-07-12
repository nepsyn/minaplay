import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Media } from './media.entity';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { FileModule } from '../file/file.module';
import { MediaConfigurableModule } from './media.module-definition';
import { AuthorizationModule } from '../authorization/authorization.module';
import { UserModule } from '../user/user.module';
import { MediaFfmpegService } from './media-ffmpeg.service';

@Module({
  imports: [TypeOrmModule.forFeature([Media]), FileModule, AuthorizationModule, UserModule],
  providers: [MediaService, MediaFfmpegService],
  controllers: [MediaController],
  exports: [MediaService, MediaFfmpegService],
})
export class MediaModule extends MediaConfigurableModule {
  declare static register: typeof MediaConfigurableModule.register;
  declare static registerAsync: typeof MediaConfigurableModule.registerAsync;
}
