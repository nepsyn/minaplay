import { MinaPlayPluginConstructor, MinaPlayPluginDescriptor } from '../interfaces/plugins.js';
import { Injectable } from '@nestjs/common';
import { isDefined } from 'class-validator';

export const MINAPLAY_PLUGIN_KEY = 'MINAPLAY_PLUGIN';

export function MinaPlayPlugin(options: MinaPlayPluginDescriptor): ClassDecorator {
  return function (target: Function) {
    Reflect.decorate([Injectable()], target);
    Reflect.defineMetadata(MINAPLAY_PLUGIN_KEY, options, target);
  };
}

export function getMinaPlayPluginDescriptor(target: Function): MinaPlayPluginDescriptor {
  return Reflect.getMetadata(MINAPLAY_PLUGIN_KEY, target);
}

export function isMinaPlayPlugin(target: Function): target is MinaPlayPluginConstructor {
  const descriptor = getMinaPlayPluginDescriptor(target);
  return isDefined(descriptor?.id);
}
