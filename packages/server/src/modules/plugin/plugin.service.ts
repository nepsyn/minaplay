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
import { register } from 'node:module';
import { PLUGIN_DIR } from '../../constants.js';

@Injectable()
export class PluginService implements OnModuleInit {
  private logger = new ApplicationLogger(PluginService.name);
  private controls: PluginControl[] = [];

  constructor(private lazyModuleLoader: LazyModuleLoader) {}

  async findPlugins(dir?: string) {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const base = dir ?? path.join(__dirname, './builtin');
    await fs.ensureDir(base);

    const files = fs
      .readdirSync(base, { withFileTypes: true })
      .flatMap((file) =>
        file.isDirectory() ? fs.readdirSync(path.join(file.path, file.name), { withFileTypes: true }) : file,
      )
      .filter((file) => file.isFile() && (file.name.endsWith('.plugin.js') || file.name.endsWith('.plugin.mjs')))
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
    if (this.getControlById(metadata.id)) {
      this.logger.error(`Error occurred while creating plugin instance: Duplicated plugin id '${metadata.id}'`);
      return;
    }

    try {
      const control = new PluginControl({
        id: metadata.id,
        version: metadata.version,
        description: metadata.description,
        author: metadata.author,
        repo: metadata.repo,
        license: metadata.license,
        enabled: true,
        type: plugin,
        contexts: new Map(),
      });
      this.controls.push(control);

      // initialize services
      control.module = await this.lazyModuleLoader.load(() => plugin, { logger: false });
      control.commands = new Map();
      control.listeners = [];
      control.services = [];
      for (const provider of metadata.providers ?? []) {
        if (typeof provider === 'function') {
          // commands
          const commandsMetadata: Map<string, MinaPlayCommandMetadata> = Reflect.getMetadata(
            MINAPLAY_COMMAND_METADATA,
            provider,
          );
          if (commandsMetadata) {
            for (const [bin, commandMetadata] of commandsMetadata.entries()) {
              control.commands.set(bin, commandMetadata);
              this.logger.log(`Plugin '${metadata.id}' registered command '${bin}'`);
            }
          }

          // listeners
          const listenersMetadata: MinaPlayMessageListenerMetadata[] = Reflect.getMetadata(
            MINAPLAY_LISTENER_METADATA,
            provider,
          );
          if (listenersMetadata) {
            control.listeners.push(...listenersMetadata);
          }

          const service = control.module.get(provider);
          control.services.push(service);
        }
      }

      // emit onInit
      await this.emit(control, 'onPluginInit');

      this.logger.log(`Plugin '${metadata.id}(${metadata.version ?? 'unknown version'})' registered`);
    } catch (error) {
      this.logger.error(
        `Error occurred while creating plugin instance: '${metadata.id}'`,
        error.stack,
        PluginService.name,
      );
    }
  }

  registerImportMap() {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    register(pathToFileURL(path.join(__dirname, './import-map-hooks.js')));
  }

  async onModuleInit() {
    this.registerImportMap();

    // register built in plugins
    for (const plugin of await this.findPlugins()) {
      await this.registerPlugin(plugin);
    }

    // register plugins in data dir
    for (const plugin of await this.findPlugins(PLUGIN_DIR)) {
      await this.registerPlugin(plugin);
    }

    await this.emitAllEnabled('onPluginEnabled');
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
      return;
    }

    if (control.enabled !== enabled) {
      control.enabled = enabled;
      await this.emit(control, control.enabled ? 'onPluginEnabled' : 'onPluginDisabled');
    }

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
        context.control.contexts.delete(socket.data.user.id);
      }),
    );
  }

  getAllControls() {
    return this.controls.concat();
  }

  getControlById(id: string) {
    return this.controls.find((control) => control.id === id);
  }
}
