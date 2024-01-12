import { ConfigurableModuleBuilder } from '@nestjs/common';
import { Aria2ModuleOptions } from './aria2.module.interface.js';

export const { ConfigurableModuleClass: Aria2ConfigurableModule, MODULE_OPTIONS_TOKEN: ARIA2_MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<Aria2ModuleOptions>({ moduleName: 'Aria2' })
    .setExtras({ isGlobal: true }, (definition, extras) => ({
      ...definition,
      global: extras.isGlobal,
    }))
    .build();
