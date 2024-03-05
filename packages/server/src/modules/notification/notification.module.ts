import { Module } from '@nestjs/common';
import { NotificationConfigurableModule } from './notification.module-definition.js';
import { AuthorizationModule } from '../authorization/authorization.module.js';
import { UserModule } from '../user/user.module.js';
import { NotificationService } from './notification.service.js';
import { NotificationController } from './notification.controller.js';
import { DiscoveryModule } from '@nestjs/core';
import { EmailAdapter } from './adapters/email/email.adapter.js';
import { NotificationGateway } from './adapters/ws/notification.gateway.js';
import { WsAdapter } from './adapters/ws/ws.adapter.js';
import { NotificationMetaService } from './notification-meta.service.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationMeta } from './notification-meta.entity.js';
import { BullModule } from '@nestjs/bull';
import { NotificationConsumer } from './notification.consumer.js';

@Module({
  imports: [
    AuthorizationModule,
    UserModule,
    DiscoveryModule,
    TypeOrmModule.forFeature([NotificationMeta]),
    BullModule.registerQueue({ name: 'notification' }),
  ],
  providers: [
    NotificationService,
    NotificationMetaService,
    EmailAdapter,
    NotificationGateway,
    WsAdapter,
    NotificationConsumer,
  ],
  controllers: [NotificationController],
  exports: [NotificationService],
})
export class NotificationModule extends NotificationConfigurableModule {
  declare static register: typeof NotificationConfigurableModule.register;
  declare static registerAsync: typeof NotificationConfigurableModule.registerAsync;
}
