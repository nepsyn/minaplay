import { DynamicModule, ForwardReference, Type } from '@nestjs/common';

export interface MinaPlayPluginDescriptor {
  id: string;
  imports?: (Type | DynamicModule | Promise<DynamicModule> | ForwardReference)[];
  version?: string;
  description?: string;
  author?: string;
  repo?: string;
}

export interface MinaPlayPluginHooks {
  onEnabled?();
  onDisabled?();

  onNewMedia?(mediaId: string);
  onNewEpisode?(seriesId: number);
}

export type MinaPlayPluginConstructor = new (...args: any) => MinaPlayPluginHooks;
