import { ConfigurableModuleBuilder } from '@nestjs/common';
import { NotificationModuleOptions } from './notification.module.interface';

export const {
  ConfigurableModuleClass: NotificationConfigurableModule,
  MODULE_OPTIONS_TOKEN: NOTIFICATION_MODULE_OPTIONS_TOKEN,
} = new ConfigurableModuleBuilder<NotificationModuleOptions>({ moduleName: 'Notification' })
  .setExtras({ isGlobal: true }, (definition, extras) => ({
    ...definition,
    global: extras.isGlobal,
  }))
  .build();
