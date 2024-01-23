import { Injectable, InjectionToken, OnModuleInit, Type, ValueProvider } from '@nestjs/common';
import { LazyModuleLoader } from '@nestjs/core';
import {
  MinaPlayCommandMetadata,
  MinaPlayMessageListenerMetadata,
  MinaPlayParamMetadata,
  MinaPlayPluginHooks,
  MinaPlayPluginMessage,
} from './plugin.interface.js';
import { PluginControl } from './plugin-control.js';
import { getMinaPlayPluginMetadata, isMinaPlayPlugin } from './plugin.decorator.js';
import { ApplicationLogger } from '../../common/application.logger.service.js';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import fs from 'fs-extra';
import { isArray, isString } from 'class-validator';
import { MinaPlayMessage, Text } from '../../common/application.message.js';
import { User } from '../user/user.entity.js';
import {
  MESSAGE_TOKEN,
  MINAPLAY_COMMAND_METADATA,
  MINAPLAY_LISTENER_METADATA,
  PROGRAM_ROOT_TOKEN,
} from './constants.js';
import { Socket } from 'socket.io';
import { PluginChatSession } from './plugin-chat-session.js';

@Injectable()
export class PluginService implements OnModuleInit {
  private logger = new ApplicationLogger(PluginService.name);
  private controls: PluginControl[] = [];
  constructor(private lazyModuleLoader: LazyModuleLoader) {}

  private async findPlugins() {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const base = path.join(__dirname, '../../plugins');
    await fs.ensureDir(base);

    const files = fs
      .readdirSync(base, { withFileTypes: true })
      .filter((file) => file.isDirectory())
      .flatMap((dir) => fs.readdirSync(path.join(dir.path, dir.name), { withFileTypes: true }))
      .filter((file) => file.isFile() && file.name.endsWith('.plugin.js'))
      .map((file) => pathToFileURL(path.join(file.path, file.name)).href);

    const plugins: Type[] = [];
    for (const file of files) {
      try {
        const module: object = await import(file);
        for (const attr of Object.values(module)) {
          if (isMinaPlayPlugin(attr)) {
            plugins.push(attr);
          }
        }
      } catch (error) {
        this.logger.error(
          `Error occurred while loading plugin file: ${path.basename(file)}`,
          error.stack,
          PluginService.name,
        );
      }
    }

    return plugins;
  }

  async registerPlugin(plugin: Type) {
    const metadata = getMinaPlayPluginMetadata(plugin);
    try {
      // initialize services
      const module = await this.lazyModuleLoader.load(() => plugin);
      const commands: Map<string, MinaPlayCommandMetadata> = new Map();
      const listeners: MinaPlayMessageListenerMetadata[] = [];
      const services: MinaPlayPluginHooks[] = [];
      for (const provider of metadata.providers ?? []) {
        if (typeof provider === 'function') {
          // commands
          const commandsMetadata: Map<string, MinaPlayCommandMetadata> = Reflect.getMetadata(
            MINAPLAY_COMMAND_METADATA,
            provider,
          );
          if (commandsMetadata) {
            for (const [bin, commandMetadata] of commandsMetadata.entries()) {
              commands.set(bin, commandMetadata);
              this.logger.log(`Plugin '${metadata.id}' registered command '${bin}'`);
            }
          }

          // listeners
          const listenersMetadata: MinaPlayMessageListenerMetadata[] = Reflect.getMetadata(
            MINAPLAY_LISTENER_METADATA,
            provider,
          );
          if (listenersMetadata) {
            listeners.push(...listenersMetadata);
          }

          const service = module.get(provider);
          services.push(service);
        }
      }

      if (this.getControl(metadata.id)) {
        this.logger.error(`Error occurred while creating plugin instance: Duplicated plugin id '${metadata.id}'`);
        return;
      }

      const control = Object.assign(new PluginControl(), {
        id: metadata.id,
        version: metadata.version,
        description: metadata.description,
        author: metadata.author,
        repo: metadata.repo,
        enabled: true,
        services,
        type: plugin,
        module,
        commands,
        listeners,
      });
      this.controls.push(control);

      this.logger.log(`Plugin '${metadata.id}(${metadata.version ?? 'unknown version'})' registered`);
    } catch (error) {
      this.logger.error(
        `Error occurred while creating plugin instance: '${metadata.id}'`,
        error.stack,
        PluginService.name,
      );
    }
  }

  async onModuleInit() {
    const plugins = await this.findPlugins();
    for (const plugin of plugins) {
      await this.registerPlugin(plugin);
    }

    await this.emitAllEnabled('onEnabled');
  }

  async emit<T extends keyof MinaPlayPluginHooks>(
    control: PluginControl,
    hook: T,
    ...args: Parameters<MinaPlayPluginHooks[T]>
  ) {
    try {
      for (const service of control.services) {
        await service[hook]?.apply(service, args);
      }
    } catch (error) {
      this.logger.error(
        `Error occurred while invoking hook '${hook}' on plugin '${control.id}'`,
        error.stack,
        PluginService.name,
      );
    }
  }

  get enabledPluginControls() {
    return this.controls.filter((control) => control.enabled);
  }

  async emitAllEnabled<T extends keyof MinaPlayPluginHooks>(hook: T, ...args: Parameters<MinaPlayPluginHooks[T]>) {
    for (const control of this.controls.filter(({ enabled }) => enabled)) {
      await this.emit(control, hook, ...args);
    }
  }

  async toggleEnabled(id: string, enabled: boolean) {
    const control = this.controls.find((control) => control.id === id);
    if (!control) {
      return undefined;
    }

    if (enabled && !control.enabled) {
      await this.emit(control, 'onEnabled');
    } else if (!enabled && control.enabled) {
      await this.emit(control, 'onDisabled');
    }

    control.enabled = enabled;

    return control;
  }

  private async createRuntimeParams(
    control: PluginControl,
    container: Map<InjectionToken, any>,
    metadata: MinaPlayMessageListenerMetadata | InjectionToken[],
  ) {
    const params = [];
    const tokens: MinaPlayParamMetadata[] = isArray(metadata)
      ? metadata.map((value, index) => ({ index, token: value }))
      : metadata.params;
    for (const { index, token } of tokens) {
      if (container.has(token)) {
        params[index] = container.get(token);
      } else {
        try {
          params[index] = control.module.get(token);
        } catch {
          if (!isArray(metadata)) {
            this.logger.warn(
              `Unable to resolve dependency type on ${metadata.type.name}#${String(metadata.key)} at index ${index}`,
            );
          }
        }
      }
    }
    return params;
  }

  private async emitPluginListeners(message: MinaPlayMessage, control: PluginControl, socket: Socket) {
    const messages: MinaPlayMessage[] = [];
    for (const metadata of control.listeners) {
      const result = await this.emitListener(message, control, metadata, socket);
      if (isString(result)) {
        messages.push(new Text(result));
      } else if ('type' in messages) {
        messages.push(result);
      } else if (isArray(result)) {
        messages.push(...result);
      }
    }
    return messages;
  }

  private async emitListener(
    message: MinaPlayMessage,
    control: PluginControl,
    metadata: MinaPlayMessageListenerMetadata,
    socket: Socket,
  ) {
    const service = control.module.get(metadata.type);

    const container = new Map<InjectionToken, any>();
    // initial deps
    container.set(MESSAGE_TOKEN, message);
    container.set(Socket, socket);
    container.set(User, socket.data.user);
    container.set(PluginChatSession, new PluginChatSession(socket, control));
    container.set(PROGRAM_ROOT_TOKEN, control.commands);

    const preprocessProviders: ValueProvider[] = [];
    for (const { injects, factory } of metadata.preprocessors) {
      try {
        const params = await this.createRuntimeParams(control, container, injects);
        const providers = (await factory(...params)) ?? [];
        preprocessProviders.push(...providers);
      } catch (error) {
        this.logger.error(
          `Error occurred while running preprocessor of ${metadata.type.name}#${String(metadata.key)}`,
          error.stack,
          PluginService.name,
        );
        return;
      }
    }
    for (const { provide, useValue } of preprocessProviders) {
      if (!container.has(provide)) {
        container.set(provide, useValue);
      }
    }

    for (const { injects, factory } of metadata.validators) {
      try {
        const params = await this.createRuntimeParams(control, container, injects);
        const valid = await factory(...params);
        if (!valid) {
          return;
        }
      } catch (error) {
        this.logger.error(
          `Error occurred while running validator of ${metadata.type.name}#${String(metadata.key)}`,
          error.stack,
          PluginService.name,
        );
        return;
      }
    }

    try {
      const params = await this.createRuntimeParams(control, container, metadata);
      return await service[metadata.key](...params);
    } catch (error) {
      this.logger.error(
        `Error occurred while running message listener '${control.type.name}#${String(metadata.key)}'`,
        error.stack,
        PluginService.name,
      );
    }
  }

  async handleMessage(message: MinaPlayMessage, socket: Socket): Promise<MinaPlayPluginMessage[]> {
    const controls = this.enabledPluginControls;
    const results = await Promise.allSettled(
      controls.map((control) => this.emitPluginListeners(message, control, socket)),
    );
    return results
      .map((result, index) => {
        return {
          control: controls[index],
          messages: result.status === 'fulfilled' ? result.value : undefined,
        };
      })
      .filter(({ messages }) => messages?.length > 0);
  }

  getAllControls() {
    return this.controls.concat();
  }

  getControl(id: string) {
    return this.controls.find((control) => control.id === id);
  }
}
