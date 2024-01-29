import { MinaPlayCommandMetadata, MinaPlayMessageListenerMetadata, MinaPlayPluginHooks } from './plugin.interface.js';
import { Type } from '@nestjs/common';
import { Exclude, Expose } from 'class-transformer';
import { ModuleRef } from '@nestjs/core';
import { PluginChatContext } from './plugin-chat-context.js';

export class PluginControl {
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
  enabled: boolean;

  @Exclude()
  services: MinaPlayPluginHooks[];

  @Exclude()
  type: Type;

  @Exclude()
  module: ModuleRef;

  @Exclude()
  commands: Map<string, MinaPlayCommandMetadata>;

  @Exclude()
  listeners: MinaPlayMessageListenerMetadata[];

  @Exclude()
  contexts: Map<number, PluginChatContext>;
}
