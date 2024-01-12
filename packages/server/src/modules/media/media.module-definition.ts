import { ConfigurableModuleBuilder } from '@nestjs/common';
import { MediaModuleOptions } from './media.module.interface.js';

export const { ConfigurableModuleClass: MediaConfigurableModule, MODULE_OPTIONS_TOKEN: MEDIA_MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<MediaModuleOptions>({ moduleName: 'Media' })
    .setExtras({ isGlobal: true }, (definition, extras) => ({
      ...definition,
      global: extras.isGlobal,
    }))
    .build();
