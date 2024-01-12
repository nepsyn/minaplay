import { ConfigurableModuleBuilder } from '@nestjs/common';
import { LiveModuleOptions } from './live.module.interface.js';

export const { ConfigurableModuleClass: LiveConfigurableModule, MODULE_OPTIONS_TOKEN: LIVE_MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<LiveModuleOptions>({ moduleName: 'Live' })
    .setExtras({ isGlobal: true }, (definition, extras) => ({
      ...definition,
      global: extras.isGlobal,
    }))
    .build();
