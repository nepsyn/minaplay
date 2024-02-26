import { InjectionToken, ModuleMetadata, ValueProvider } from '@nestjs/common';
import { Argument, Command, Option } from 'commander';
import { Observable } from 'rxjs';
import { MinaPlayMessage } from '../../common/application.message.js';
import { PluginListenerContext } from './plugin-listener-context.js';

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

  onPluginUninstall?(): any;
}

export type MinaPlayListenerResult = string | MinaPlayMessage | MinaPlayMessage[] | undefined;

export interface MinaPlayCallHandlerOptions {
  provides: ValueProvider[];
}

export interface MinaPlayCallHandler {
  handle(options?: MinaPlayCallHandlerOptions): Observable<MinaPlayListenerResult>;
  end(message?: MinaPlayListenerResult): Observable<MinaPlayListenerResult>;
}

export interface MinaPlayMessageListenerInterceptor {
  (ctx: PluginListenerContext, message: MinaPlayMessage, next: MinaPlayCallHandler):
    | Observable<MinaPlayListenerResult>
    | Promise<Observable<MinaPlayListenerResult>>;
}

export interface MinaPlayParamMetadata {
  index: number;
  param: InjectionToken;
}

export interface MinaPlayMessageListenerMetadata {
  interceptors: MinaPlayMessageListenerInterceptor[];
  type: Function;
  key: string | symbol;
  params: MinaPlayParamMetadata[];
}

export interface MinaPlayMessageListenerOptions {
  interceptors?: MinaPlayMessageListenerInterceptor[];
}

export interface MinaPlayCommanderArgMetadata {
  index: number;
  instance: Option | Argument;
}

export interface MinaPlayCommandOptions extends MinaPlayMessageListenerOptions {
  aliases?: string[];
  description?: string;
  parent?: () => Function;
  factory?: (program: Command) => Command;
}

export interface MinaPlayCommandMetadata {
  bin: string;
  aliases?: string[];
  parent?: () => Function;
  handler: Function;
  commandFactory: () => Command;
  subcommands: MinaPlayCommandMetadata[];
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
