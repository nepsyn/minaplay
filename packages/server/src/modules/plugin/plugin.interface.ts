import { ModuleMetadata } from '@nestjs/common';
import { Argument, Command, Option } from 'commander';
import { MinaplayMessage } from '../../common/application.message.js';
import { PluginControl } from './plugin-control.js';

export interface MinaPlayPluginMetadata extends Pick<ModuleMetadata, 'imports' | 'providers'> {
  id: string;
  version?: string;
  description?: string;
  author?: string;
  repo?: string;
}

export interface MinaPlayPluginHooks {
  onEnabled?(): any;

  onDisabled?(): any;
}

export interface PluginCommandArgMetadata {
  index: number;
  instance: Option | Argument | 'program';
}

export interface PluginCommandMetadata {
  program: Command;
  type: Function;
  key: PropertyKey;
  args: PluginCommandArgMetadata[];
  subcommands?: Map<string, PluginCommandMetadata>;
}

export interface PluginCommandOptions {
  aliases?: string[];
  description?: string;
  parents?: string[];
  factory?: (program: Command) => Command;
}

export interface PluginCommandOptionOptions {
  description?: string;
  default?: any;
  factory?: (option: Option) => Option;
}

export interface PluginCommandArgumentOptions {
  description?: string;
  required?: boolean;
  default?: any;
  factory?: (option: Argument) => Argument;
}

export interface MinaPlayCommandResult {
  control: PluginControl;
  result?: MinaplayMessage[];
  error?: string;
}
