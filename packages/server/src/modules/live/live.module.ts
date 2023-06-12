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

@Module({
  imports: [TypeOrmModule.forFeature([Live, LiveChat]), AuthorizationModule, UserModule],
  providers: [LiveService, LiveChatService, LiveGateway],
  controllers: [LiveController],
  exports: [LiveService, LiveChatService],
})
export class LiveModule extends LiveConfigurableModule {
  declare static register: typeof LiveConfigurableModule.register;
  declare static registerAsync: typeof LiveConfigurableModule.registerAsync;
}
