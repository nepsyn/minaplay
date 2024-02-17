import { InjectionToken, ModuleMetadata, ValueProvider } from '@nestjs/common';
import { Argument, Command, Option } from 'commander';

export interface MinaPlayPluginMetadata extends Pick<ModuleMetadata, 'imports' | 'providers'> {
  id: string;
  version?: string;
  description?: string;
  author?: string;
  repo?: string;
  license?: string;
}

export interface MinaPlayPluginHooks {
  onPluginInit?(): any;

  onPluginEnabled?(): any;

  onPluginDisabled?(): any;
}

export interface MinaPlayMessagePreprocessor {
  injects?: InjectionToken[];
  factory: (...args: any) => ValueProvider[] | undefined | Promise<ValueProvider[] | undefined>;
}

export interface MinaPlayMessageValidator {
  injects?: InjectionToken[];
  factory: (...args: any) => boolean | Promise<boolean>;
}

export interface MinaPlayParamMetadata {
  index: number;
  param: InjectionToken;
}

export interface MinaPlayMessageListenerMetadata {
  preprocessors: MinaPlayMessagePreprocessor[];
  validators: MinaPlayMessageValidator[];
  type: Function;
  key: string | symbol;
  params: MinaPlayParamMetadata[];
}

export interface MinaPlayMessageListenerOptions {
  preprocessors?: MinaPlayMessagePreprocessor[];
  validators?: MinaPlayMessageValidator[];
}

export interface MinaPlayCommanderArgMetadata {
  index: number;
  instance: Option | Argument;
}

export interface MinaPlayCommandMetadata {
  program: Command;
  programFactory: () => Command;
  subcommands?: Map<string, MinaPlayCommandMetadata>;
}

export interface MinaPlayCommandOptions extends MinaPlayMessageListenerOptions {
  aliases?: string[];
  description?: string;
  parents?: string[];
  factory?: (program: Command) => Command;
}

export interface MinaPlayCommandOptionOptions {
  description?: string;
  default?: any;
  factory?: (option: Option) => Option;
}

export interface MinaPlayCommandArgumentOptions {
  description?: string;
  required?: boolean;
  default?: any;
  factory?: (option: Argument) => Argument;
}
