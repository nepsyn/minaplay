import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Live } from './live.entity.js';
import { LiveController } from './live.controller.js';
import { LiveService } from './live.service.js';
import { LiveConfigurableModule } from './live.module-definition.js';
import { AuthorizationModule } from '../authorization/authorization.module.js';
import { UserModule } from '../user/user.module.js';
import { LiveGateway } from './live.gateway.js';
import { LiveChatService } from './live-chat.service.js';
import { LiveChat } from './live-chat.entity.js';
import { LiveVoiceService } from './live-voice.service.js';
import { LiveStreamService } from './live-stream.service.js';
import { FileModule } from '../file/file.module.js';
import { LiveStreamController } from './live-stream.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Live, LiveChat]), AuthorizationModule, UserModule, FileModule],
  providers: [LiveService, LiveVoiceService, LiveStreamService, LiveChatService, LiveGateway],
  controllers: [LiveStreamController, LiveController],
  exports: [LiveService, LiveVoiceService, LiveStreamService, LiveChatService],
})
export class LiveModule extends LiveConfigurableModule {
  declare static register: typeof LiveConfigurableModule.register;
  declare static registerAsync: typeof LiveConfigurableModule.registerAsync;
}
