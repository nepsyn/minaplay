import { Global, Module } from '@nestjs/common';
import { PluginService } from './plugin.service.js';
import { AuthorizationModule } from '../authorization/authorization.module.js';
import { UserModule } from '../user/user.module.js';
import { PluginController } from './plugin.controller.js';
import { PluginGateway } from './plugin.gateway.js';
import { PLUGIN_SERVICE_TOKEN } from './constants.js';

@Global()
@Module({
  imports: [AuthorizationModule, UserModule],
  controllers: [PluginController],
  providers: [
    PluginService,
    PluginGateway,
    {
      provide: PLUGIN_SERVICE_TOKEN,
      useExisting: PluginService,
    },
  ],
  exports: [PluginService, PLUGIN_SERVICE_TOKEN],
})
export class PluginModule {}
