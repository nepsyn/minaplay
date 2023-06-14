import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Live } from './live.entity';
import { LiveController } from './live.controller';
import { LiveService } from './live.service';
import { LiveConfigurableModule } from './live.module-definition';
import { AuthorizationModule } from '../authorization/authorization.module';
import { UserModule } from '../user/user.module';
import { LiveGateway } from './live.gateway';
import { LiveChatService } from './live-chat.service';
import { LiveChat } from './live-chat.entity';
import { LiveVoiceService } from './live-voice.service';
import { LiveStreamService } from './live-stream.service';
import { FileModule } from '../file/file.module';

@Module({
  imports: [TypeOrmModule.forFeature([Live, LiveChat]), AuthorizationModule, UserModule, FileModule],
  providers: [LiveService, LiveVoiceService, LiveStreamService, LiveChatService, LiveGateway],
  controllers: [LiveController],
  exports: [LiveService, LiveVoiceService, LiveStreamService, LiveChatService],
})
export class LiveModule extends LiveConfigurableModule {
  declare static register: typeof LiveConfigurableModule.register;
  declare static registerAsync: typeof LiveConfigurableModule.registerAsync;
}
