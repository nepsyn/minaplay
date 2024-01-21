import { Module } from '@nestjs/common';
import { PluginService } from './plugin.service.js';
import { AuthorizationModule } from '../authorization/authorization.module.js';
import { UserModule } from '../user/user.module.js';
import { PluginController } from './plugin.controller.js';
import { PluginGateway } from './plugin.gateway.js';

@Module({
  imports: [AuthorizationModule, UserModule],
  controllers: [PluginController],
  providers: [PluginService, PluginGateway],
  exports: [PluginService],
})
export class PluginModule {}
