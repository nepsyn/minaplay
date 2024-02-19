import { MinaPlayCommandMetadata, MinaPlayMessageListenerMetadata, MinaPlayPluginHooks } from './plugin.interface.js';
import { Type } from '@nestjs/common';
import { Exclude, Expose } from 'class-transformer';
import { ModuleRef } from '@nestjs/core';
import { PluginListenerContext } from './plugin-listener-context.js';

export class PluginControl {
  constructor(options?: Partial<PluginControl>) {
    Object.assign(this, options);
  }

  @Expose()
  id: string;

  @Expose()
  version?: string;

  @Expose()
  description?: string;

  @Expose()
  author?: string;

  @Expose()
  repo?: string;

  @Expose()
  license?: string;

  @Expose()
  enabled: boolean;

  @Exclude()
  services: MinaPlayPluginHooks[];

  @Exclude()
  type: Type;

  @Exclude()
  module: ModuleRef;

  @Exclude()
  commands: MinaPlayCommandMetadata[];

  @Expose()
  get programs() {
    return this.commands.map(({ bin }) => bin);
  }

  @Exclude()
  listeners: MinaPlayMessageListenerMetadata[];

  @Exclude()
  contexts: Map<number, PluginListenerContext>;
}
