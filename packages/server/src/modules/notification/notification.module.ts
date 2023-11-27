import { Module } from '@nestjs/common';
import { NotificationConfigurableModule } from './notification.module-definition';
import { EmailService } from './email.service';
import { NotificationGateway } from './notification.gateway';
import { AuthorizationModule } from '../authorization/authorization.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [AuthorizationModule, UserModule],
  providers: [EmailService, NotificationGateway],
  exports: [EmailService, NotificationGateway],
})
export class NotificationModule extends NotificationConfigurableModule {
  declare static register: typeof NotificationConfigurableModule.register;
  declare static registerAsync: typeof NotificationConfigurableModule.registerAsync;
}
