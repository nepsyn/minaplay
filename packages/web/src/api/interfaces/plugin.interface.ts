import { MinaPlayMessage } from '@/api/interfaces/message.interface';

export interface PluginControl {
  id: string;
  icon?: string;
  version?: string;
  description?: string;
  author?: string;
  repo?: string;
  license?: string;
  enabled: boolean;
  isBuiltin: boolean;
  programs: string[];
}

export interface PluginCommandDescriptor {
  program: string;
  control: PluginControl;
  description: string;
}

export interface MinaPlayPluginMessage {
  from: 'user' | 'plugin';
  control?: PluginControl;
  messages: MinaPlayMessage[];
}

export type PluginEventMap = {
  console: (arg: { message: MinaPlayMessage; locale?: string }) => MinaPlayMessage[] | undefined;
  commands: () => PluginCommandDescriptor[];
};
