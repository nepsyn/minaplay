import { MinaPlayPluginDescriptor, MinaPlayPluginHooks } from '../../interfaces/plugins.js';
import { Type } from '@nestjs/common';
import { Exclude, Expose } from 'class-transformer';

export class PluginControl implements MinaPlayPluginDescriptor {
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

  @Exclude({ toPlainOnly: true })
  services: MinaPlayPluginHooks[];

  @Exclude({ toPlainOnly: true })
  type: Type;

  @Expose()
  enabled: boolean;
}
