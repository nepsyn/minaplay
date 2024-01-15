import { MinaPlayPluginHooks } from '../../interfaces/plugins.js';
import { Type } from '@nestjs/common';
import { Exclude, Expose } from 'class-transformer';

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
}
