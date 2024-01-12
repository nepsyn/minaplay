import { ConfigurableModuleBuilder } from '@nestjs/common';
import { SubscribeModuleOptions } from './subscribe.module.interface.js';

export const {
  ConfigurableModuleClass: SubscribeConfigurableModule,
  MODULE_OPTIONS_TOKEN: SUBSCRIBE_MODULE_OPTIONS_TOKEN,
} = new ConfigurableModuleBuilder<SubscribeModuleOptions>({ moduleName: 'Subscribe' })
  .setExtras({ isGlobal: true }, (definition, extras) => ({
    ...definition,
    global: extras.isGlobal,
  }))
  .build();
