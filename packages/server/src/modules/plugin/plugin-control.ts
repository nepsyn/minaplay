import { MinaPlayPluginConstructor, MinaPlayPluginDescriptor, MinaPlayPluginHooks } from '../../interfaces/plugins';
import { DynamicModule, ForwardReference, Type } from '@nestjs/common';
import { Exclude, Expose } from 'class-transformer';

export class PluginControl implements MinaPlayPluginDescriptor {
  @Expose()
  id: string;

  @Exclude({ toPlainOnly: true })
  imports?: (Type | DynamicModule | Promise<DynamicModule> | ForwardReference)[];

  @Expose()
  version?: string;

  @Expose()
  description?: string;

  @Expose()
  author?: string;

  @Expose()
  repo?: string;

  @Exclude({ toPlainOnly: true })
  instance: MinaPlayPluginHooks;

  @Exclude({ toPlainOnly: true })
  type: MinaPlayPluginConstructor;

  @Expose()
  enabled: boolean;
}
