import { Injectable, OnModuleInit, Type } from '@nestjs/common';
import { LazyModuleLoader } from '@nestjs/core';
import { MinaPlayCommandMetadata, MinaPlayMessageListenerMetadata, MinaPlayPluginHooks } from './plugin.interface.js';
import { PluginControl } from './plugin-control.js';
import { getMinaPlayPluginMetadata, isMinaPlayPlugin } from './plugin.decorator.js';
import { ApplicationLogger } from '../../common/application.logger.service.js';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import fs from 'fs-extra';
import { MinaPlayMessage } from '../../common/application.message.js';
import { MINAPLAY_COMMAND_METADATA, MINAPLAY_LISTENER_METADATA } from './constants.js';
import { Socket } from 'socket.io';
import { PluginChatContext } from './plugin-chat-context.js';
import { instanceToPlain } from 'class-transformer';

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
      const module = await this.lazyModuleLoader.load(() => plugin, { logger: false });
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
        contexts: new Map(),
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

  async handleGatewayMessage(message: MinaPlayMessage, socket: Socket) {
    const contexts = this.enabledPluginControls.map((control) => {
      const context = control.contexts.get(socket.data.user.id) ?? new PluginChatContext(socket.data.user, control);
      control.contexts.set(socket.data.user.id, context);
      return context;
    });
    await Promise.allSettled(
      contexts.map(async (context) => {
        context.removeAllListeners('send');
        context.on('send', async (messages: MinaPlayMessage[]) => {
          socket.emit(
            'console',
            instanceToPlain({
              plugin: context.control,
              messages,
            }),
          );
        });
        await context.handleMessage(message);
      }),
    );
  }

  getAllControls() {
    return this.controls.concat();
  }

  getControl(id: string) {
    return this.controls.find((control) => control.id === id);
  }
}
