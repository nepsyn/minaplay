import { MinaPlayPluginMetadata } from './plugin.interface.js';
import { Module, Type } from '@nestjs/common';
import { isDefined } from 'class-validator';

export const MINAPLAY_PLUGIN_KEY = 'MINAPLAY_PLUGIN';

export function MinaPlayPlugin(metadata: MinaPlayPluginMetadata): ClassDecorator {
  return function (target: Function) {
    Reflect.decorate(
      [
        Module({
          imports: metadata.imports,
          providers: metadata.providers,
        }),
      ],
      target,
    );
    Reflect.defineMetadata(MINAPLAY_PLUGIN_KEY, metadata, target);
  };
}

export function getMinaPlayPluginMetadata(target: Function): MinaPlayPluginMetadata {
  return Reflect.getMetadata(MINAPLAY_PLUGIN_KEY, target);
}

export function isMinaPlayPlugin(target: Type) {
  const descriptor = getMinaPlayPluginMetadata(target);
  return isDefined(descriptor?.id);
}
