import {
  MinaPlayCommandArgumentOptions,
  MinaPlayCommanderArgMetadata,
  MinaPlayCommandMetadata,
  MinaPlayCommandOptionOptions,
  MinaPlayCommandOptions,
  MinaPlayMessageListenerMetadata,
  MinaPlayMessageListenerOptions,
  MinaPlayParamMetadata,
  MinaPlayPluginMetadata,
} from './plugin.interface.js';
import { InjectionToken, Module, Provider, Type } from '@nestjs/common';
import { isDefined } from 'class-validator';
import {
  COMMAND_ARGUMENTS_TOKEN,
  COMMAND_OPTIONS_TOKEN,
  MESSAGE_TOKEN,
  MINAPLAY_COMMAND_ARG_METADATA,
  MINAPLAY_COMMAND_METADATA,
  MINAPLAY_LISTENER_METADATA,
  MINAPLAY_PLUGIN_ID_TOKEN,
  MINAPLAY_PLUGIN_METADATA,
} from './constants.js';
import { extendArrayMetadata } from '@nestjs/common/utils/extend-metadata.util.js';
import { PluginCommandPreprocessor } from './plugin-preprocessors.js';
import { PluginCommandValidator } from './plugin-validators.js';
import { Argument, Command, Option } from 'commander';
import { PluginRef } from './plugin-ref.js';
import { SELF_DECLARED_DEPS_METADATA } from '@nestjs/common/constants.js';

export function MinaPlayPlugin(metadata: MinaPlayPluginMetadata): ClassDecorator {
  return function (target: Function) {
    Reflect.decorate(
      [
        Module({
          imports: metadata.imports,
          providers: [PluginRef as Provider, { provide: MINAPLAY_PLUGIN_ID_TOKEN, useValue: metadata.id }].concat(
            metadata.providers ?? [],
          ),
        }),
      ],
      target,
    );
    Reflect.defineMetadata(MINAPLAY_PLUGIN_METADATA, metadata, target);
  };
}

export function getMinaPlayPluginMetadata(target: Function): MinaPlayPluginMetadata {
  return Reflect.getMetadata(MINAPLAY_PLUGIN_METADATA, target);
}

export function isMinaPlayPlugin(target: Type) {
  const descriptor = getMinaPlayPluginMetadata(target);
  return isDefined(descriptor?.id);
}

export function MinaPlayMessageListener(options: MinaPlayMessageListenerOptions = {}): MethodDecorator {
  return function (target, propertyKey) {
    if (typeof target === 'function') {
      throw new Error(
        `@${MinaPlayMessageListener.name} cannot apply on static method '${target.name}#${String(propertyKey)}'`,
      );
    }

    const paramsMetadata: MinaPlayParamMetadata[] =
      Reflect.getMetadata(SELF_DECLARED_DEPS_METADATA, target.constructor, propertyKey) ?? [];
    extendArrayMetadata<MinaPlayMessageListenerMetadata[]>(
      MINAPLAY_LISTENER_METADATA,
      [
        {
          preprocessors: options.preprocessors ?? [],
          validators: options.validators ?? [],
          type: target.constructor,
          key: propertyKey,
          params: paramsMetadata,
        },
      ],
      target.constructor,
    );
  };
}

export function MinaPlayCommand(bin: string, options: MinaPlayCommandOptions = {}): MethodDecorator {
  return function (target, propertyKey, descriptor) {
    if (typeof target === 'function') {
      throw new Error(`@${MinaPlayCommand.name} cannot apply on static method '${target.name}#${String(propertyKey)}'`);
    }

    // get options & arguments metadata
    const argsMetadata: MinaPlayCommanderArgMetadata[] =
      Reflect.getMetadata(MINAPLAY_COMMAND_ARG_METADATA, target.constructor, propertyKey) ?? [];
    argsMetadata.sort((a, b) => a.index - b.index);
    const paramsMetadata: MinaPlayParamMetadata[] =
      Reflect.getMetadata(SELF_DECLARED_DEPS_METADATA, target.constructor, propertyKey) ?? [];

    // merge parameters metadata
    let argIndex = 0;
    for (const arg of argsMetadata) {
      if (arg.instance instanceof Argument) {
        paramsMetadata.push({ index: arg.index, param: `${COMMAND_ARGUMENTS_TOKEN}:${argIndex++}` });
      } else if (arg.instance instanceof Option) {
        paramsMetadata.push({ index: arg.index, param: `${COMMAND_OPTIONS_TOKEN}:${arg.instance.attributeName()}` });
      }
    }
    Reflect.defineMetadata(SELF_DECLARED_DEPS_METADATA, paramsMetadata, target.constructor, propertyKey);

    const programFactory = () => {
      // create command instance
      let program = new Command(bin);
      program.aliases(options.aliases ?? []);
      program.description(options.description);
      program.configureOutput({
        writeOut: () => undefined,
        writeErr: () => undefined,
      });
      program.helpCommand(false);
      program.exitOverride();
      program = options.factory?.(program) ?? program;

      // add options & arguments
      for (const arg of argsMetadata) {
        if (arg.instance instanceof Argument) {
          program.addArgument(arg.instance);
        } else if (arg.instance instanceof Option) {
          program.addOption(arg.instance);
        }
      }

      return program;
    };

    // decorate this handler by @MinaPlayMessageListener
    const program = programFactory();
    Reflect.decorate(
      [
        MinaPlayMessageListener({
          preprocessors: [PluginCommandPreprocessor(program)].concat(options.preprocessors ?? []),
          validators: [PluginCommandValidator()].concat(options.validators ?? []),
        }),
      ],
      target,
      propertyKey,
      descriptor,
    );

    // create root command map
    let root: Map<string, MinaPlayCommandMetadata> = Reflect.getMetadata(MINAPLAY_COMMAND_METADATA, target.constructor);
    let commandMetadata: MinaPlayCommandMetadata | undefined = undefined;
    if (!root) {
      root = new Map();
      Reflect.defineMetadata(MINAPLAY_COMMAND_METADATA, root, target.constructor);
    }

    // find parent command
    for (const route of options.parents ?? []) {
      if (!root.has(route)) {
        throw new Error(`No parent command found for '${bin}' in '${target.constructor.name}#${String(propertyKey)}'`);
      }
      commandMetadata = root.get(route);
      root = root.get(route).subcommands;
    }
    commandMetadata?.program?.addCommand(program);

    // insert this command to root command map
    const metadata: MinaPlayCommandMetadata = {
      program,
      programFactory,
      subcommands: new Map(),
    };
    for (const name of [bin, ...(options.aliases ?? [])]) {
      root.set(name, metadata);
    }
  };
}

export function MinaPlayListenerInject(token?: InjectionToken): ParameterDecorator {
  return function (target, propertyKey, parameterIndex) {
    if (typeof target === 'function') {
      throw new Error(
        `@${MinaPlayCommandOption.name} cannot apply on static method '${target.name}#${String(propertyKey)}'`,
      );
    }

    const types = Reflect.getMetadata('design:paramtypes', target, propertyKey) ?? [];
    const type = token ?? types[parameterIndex];
    if (!isDefined(type)) {
      throw new Error(
        `Unknown dependency type on '${target.constructor.name}#${String(propertyKey)}' at index ${parameterIndex}`,
      );
    }

    const paramsMetadata: MinaPlayParamMetadata[] =
      Reflect.getMetadata(SELF_DECLARED_DEPS_METADATA, target.constructor, propertyKey) ?? [];
    Reflect.defineMetadata(
      SELF_DECLARED_DEPS_METADATA,
      [...paramsMetadata, { index: parameterIndex, param: type }],
      target.constructor,
      propertyKey,
    );
  };
}

export function MinaPlayCommandOption(flags: string, options: MinaPlayCommandOptionOptions = {}): ParameterDecorator {
  return function (target, propertyKey, parameterIndex) {
    if (typeof target === 'function') {
      throw new Error(
        `@${MinaPlayCommandOption.name} cannot apply on static method '${target.name}#${String(propertyKey)}'`,
      );
    }

    let option = new Option(flags, options.description);
    option.default(options.default);
    option = options.factory?.(option) ?? option;

    const argsMetadata: MinaPlayCommanderArgMetadata[] =
      Reflect.getMetadata(MINAPLAY_COMMAND_ARG_METADATA, target.constructor, propertyKey) ?? [];
    Reflect.defineMetadata(
      MINAPLAY_COMMAND_ARG_METADATA,
      [
        ...argsMetadata,
        {
          index: parameterIndex,
          instance: option,
        },
      ],
      target.constructor,
      propertyKey,
    );
  };
}

export function MinaPlayCommandArgument(arg: string, options: MinaPlayCommandArgumentOptions = {}): ParameterDecorator {
  return function (target, propertyKey, parameterIndex) {
    let argument = new Argument(arg, options.description);
    argument.default(options.default);
    if (options.required) {
      argument.argRequired();
    }
    argument = options.factory?.(argument) ?? argument;

    const argsMetadata: MinaPlayCommanderArgMetadata[] =
      Reflect.getMetadata(MINAPLAY_COMMAND_ARG_METADATA, target.constructor, propertyKey) ?? [];
    Reflect.defineMetadata(
      MINAPLAY_COMMAND_ARG_METADATA,
      [
        ...argsMetadata,
        {
          index: parameterIndex,
          instance: argument,
        },
      ],
      target.constructor,
      propertyKey,
    );
  };
}

export function MinaPlayChatMessage(): ParameterDecorator {
  return MinaPlayListenerInject(MESSAGE_TOKEN);
}
