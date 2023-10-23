import { Module } from '@nestjs/common';
import { NotificationConfigurableModule } from './notification.module-definition';
import { NotificationService } from './notification.service';
import { EmailService } from './email.service';
import { NotificationGateway } from './notification.gateway';
import { AuthorizationModule } from '../authorization/authorization.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [AuthorizationModule, UserModule],
  providers: [NotificationService, EmailService, NotificationGateway],
  exports: [NotificationService, EmailService],
})
export class NotificationModule extends NotificationConfigurableModule {
  declare static register: typeof NotificationConfigurableModule.register;
  declare static registerAsync: typeof NotificationConfigurableModule.registerAsync;
}
