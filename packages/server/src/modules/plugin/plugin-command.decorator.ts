import {
  PluginCommandArgMetadata,
  PluginCommandArgumentOptions,
  PluginCommandMetadata,
  PluginCommandOptionOptions,
  PluginCommandOptions,
} from './plugin.interface.js';
import { Argument, Command, Option } from 'commander';

export const MINAPLAY_COMMAND_KEY = 'MINAPLAY_COMMAND';
export const MINAPLAY_COMMAND_ARG_KEY = 'MINAPLAY_COMMAND_ARG';

export function MinaPlayCommand(bin: string, options: PluginCommandOptions = {}): MethodDecorator {
  return function (target, propertyKey) {
    if (typeof target === 'function') {
      throw new Error(`@${MinaPlayCommand.name} cannot apply on static method '${target.name}#${String(propertyKey)}'`);
    }

    let program = new Command(bin);
    program.aliases(options.aliases ?? []);
    program.description(options.description);
    program.configureOutput({
      writeOut: () => undefined,
      writeErr: () => undefined,
    });
    program.addHelpCommand(false);
    program.exitOverride();
    program = options.factory?.(program) ?? program;

    const argsMetadata: PluginCommandArgMetadata[] =
      Reflect.getMetadata(MINAPLAY_COMMAND_ARG_KEY, target.constructor, propertyKey) ?? [];
    argsMetadata.sort((a, b) => a.index - b.index);
    for (const arg of argsMetadata) {
      if (arg.instance instanceof Argument) {
        program.addArgument(arg.instance);
      } else if (arg.instance instanceof Option) {
        program.addOption(arg.instance);
      }
    }

    let root: Map<string, PluginCommandMetadata> = Reflect.getMetadata(MINAPLAY_COMMAND_KEY, target.constructor);
    let commandMetadata: PluginCommandMetadata | undefined = undefined;
    if (!root) {
      root = new Map();
      Reflect.defineMetadata(MINAPLAY_COMMAND_KEY, root, target.constructor);
    }

    for (const route of options.parents ?? []) {
      if (!root.has(route)) {
        throw new Error(`No parent command found for '${bin}' in '${target.constructor.name}#${String(propertyKey)}'`);
      }
      commandMetadata = root.get(route);
      root = root.get(route).subcommands;
    }
    if (commandMetadata) {
      commandMetadata.program.addCommand(program);
    }

    const metadata: PluginCommandMetadata = {
      program,
      type: target.constructor,
      key: propertyKey,
      args: argsMetadata,
      subcommands: new Map(),
    };
    for (const name of [bin, ...(options.aliases ?? [])]) {
      root.set(name, metadata);
    }
  };
}

export function MinaPlayCommandOption(flags: string, options: PluginCommandOptionOptions = {}): ParameterDecorator {
  return function (target, propertyKey, parameterIndex) {
    if (typeof target === 'function') {
      throw new Error(
        `@${MinaPlayCommandOption.name} cannot apply on static method '${target.name}#${String(propertyKey)}'`,
      );
    }

    const argsMetadata: PluginCommandArgMetadata[] =
      Reflect.getMetadata(MINAPLAY_COMMAND_ARG_KEY, target.constructor, propertyKey) ?? [];

    let option = new Option(flags, options.description);
    option.default(options.default);
    option = options.factory?.(option) ?? option;
    argsMetadata.push({ index: parameterIndex, instance: option });

    Reflect.defineMetadata(MINAPLAY_COMMAND_ARG_KEY, argsMetadata, target.constructor, propertyKey);
  };
}

export function MinaPlayCommandArgument(arg: string, options: PluginCommandArgumentOptions = {}): ParameterDecorator {
  return function (target, propertyKey, parameterIndex) {
    if (typeof target === 'function') {
      throw new Error(
        `@${MinaPlayCommandArgument.name} cannot apply on static method '${target.name}#${String(propertyKey)}'`,
      );
    }

    const argsMetadata: PluginCommandArgMetadata[] =
      Reflect.getMetadata(MINAPLAY_COMMAND_ARG_KEY, target.constructor, propertyKey) ?? [];

    let argument = new Argument(arg, options.description);
    argument.default(options.default);
    if (options.required) {
      argument.argRequired();
    }
    argument = options.factory?.(argument) ?? argument;
    argsMetadata.push({ index: parameterIndex, instance: argument });

    Reflect.defineMetadata(MINAPLAY_COMMAND_ARG_KEY, argsMetadata, target.constructor, propertyKey);
  };
}

export function CommanderProgram(): ParameterDecorator {
  return function (target, propertyKey, parameterIndex) {
    if (typeof target === 'function') {
      throw new Error(
        `@${CommanderProgram.name} cannot apply on static method '${target.name}#${String(propertyKey)}'`,
      );
    }

    const argsMetadata: PluginCommandArgMetadata[] =
      Reflect.getMetadata(MINAPLAY_COMMAND_ARG_KEY, target.constructor, propertyKey) ?? [];
    argsMetadata.push({ index: parameterIndex, instance: 'program' });
    Reflect.defineMetadata(MINAPLAY_COMMAND_ARG_KEY, argsMetadata, target.constructor, propertyKey);
  };
}
