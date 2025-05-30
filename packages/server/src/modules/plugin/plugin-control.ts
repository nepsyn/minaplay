import {
  MinaPlayCommandMetadata,
  MinaPlayMessageListenerMetadata,
  MinaPlayParserMetadata,
  MinaPlayPluginHooks,
  MinaPlayPluginMetadata,
  PluginSourceParser,
} from './plugin.interface.js';
import { Type } from '@nestjs/common';
import { Exclude, Expose } from 'class-transformer';
import { ModuleRef } from '@nestjs/core';
import { PluginListenerContext } from './plugin-listener-context.js';
import { isDefined } from 'class-validator';

export class PluginControl {
  constructor(options?: Partial<PluginControl>) {
    Object.assign(this, options);
  }

  @Expose()
  id: string;

  @Expose()
  icon?: string;

  @Expose()
  version?: string;

  @Expose()
  supportVersion?: string;

  @Expose()
  description?: string;

  @Expose()
  author?: string;

  @Expose()
  repo?: string;

  @Expose()
  package?: string;

  @Expose()
  license?: string;

  @Exclude()
  get metadata(): Omit<MinaPlayPluginMetadata, 'imports' | 'providers'> {
    return {
      id: this.id,
      icon: this.id,
      version: this.version,
      supportVersion: this.supportVersion,
      description: this.description,
      author: this.author,
      repo: this.repo,
    };
  }

  @Expose()
  enabled: boolean;

  @Exclude()
  services: MinaPlayPluginHooks[];

  @Exclude()
  parserMap: Map<string, MinaPlayParserMetadata & { service: PluginSourceParser }>;

  @Expose()
  get parsers(): MinaPlayParserMetadata[] {
    return [...this.parserMap.values()].map(({ name, features }) => ({ name, features }));
  }

  @Exclude()
  type: Type;

  @Exclude()
  path?: string;

  @Expose()
  get isBuiltin() {
    return !isDefined(this.path);
  }

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
