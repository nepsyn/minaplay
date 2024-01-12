import { Module } from '@nestjs/common';
import { NotificationConfigurableModule } from './notification.module-definition.js';
import { EmailService } from './email.service.js';
import { NotificationGateway } from './notification.gateway.js';
import { AuthorizationModule } from '../authorization/authorization.module.js';
import { UserModule } from '../user/user.module.js';

@Module({
  imports: [AuthorizationModule, UserModule],
  providers: [EmailService, NotificationGateway],
  exports: [EmailService, NotificationGateway],
})
export class NotificationModule extends NotificationConfigurableModule {
  declare static register: typeof NotificationConfigurableModule.register;
  declare static registerAsync: typeof NotificationConfigurableModule.registerAsync;
}
