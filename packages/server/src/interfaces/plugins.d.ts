import { ModuleMetadata } from '@nestjs/common';

export interface MinaPlayPluginDescriptor extends Pick<ModuleMetadata, 'imports' | 'providers'> {
  id: string;
  version?: string;
  description?: string;
  author?: string;
  repo?: string;
}

export interface MinaPlayPluginHooks {
  onEnabled?();

  onDisabled?();
}
