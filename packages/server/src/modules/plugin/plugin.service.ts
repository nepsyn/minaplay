import { Injectable, OnModuleInit, Type } from '@nestjs/common';
import { LazyModuleLoader } from '@nestjs/core';
import {
  MinaPlayCommandMetadata,
  MinaPlayMessageListenerMetadata,
  MinaPlayPluginHooks,
  PluginSourceParser,
} from './plugin.interface.js';
import { PluginControl } from './plugin-control.js';
import { getMinaPlayPluginMetadata, getMinaPlayPluginParserMetadata } from './plugin.decorator.js';
import { ApplicationLogger } from '../../common/application.logger.service.js';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import fs from 'fs-extra';
import { MinaPlayMessage } from '../../common/application.message.js';
import { MINAPLAY_COMMAND_METADATA, MINAPLAY_LISTENER_METADATA } from './constants.js';
import { Socket } from 'socket.io';
import { PluginListenerContext } from './plugin-listener-context.js';
import { instanceToPlain } from 'class-transformer';
import { register } from 'node:module';
import { MINAPLAY_VERSION, PLUGIN_DIR } from '../../constants.js';
import { isDefined, isEmpty } from 'class-validator';
import semver from 'semver';

@Injectable()
export class PluginService implements OnModuleInit {
  private logger = new ApplicationLogger(PluginService.name);
  private controls: PluginControl[] = [];

  constructor(private lazyModuleLoader: LazyModuleLoader) {}

  async findPlugins(dir: string) {
    await fs.ensureDir(dir);

    const files = fs
      .readdirSync(dir, { withFileTypes: true })
      .flatMap((file) =>
        file.isDirectory() ? fs.readdirSync(path.join(file.parentPath, file.name), { withFileTypes: true }) : file,
      )
      .filter((file) => file.isFile() && (file.name.endsWith('.plugin.js') || file.name.endsWith('.plugin.mjs')));

    const plugins: [Type, fs.Dirent][] = [];
    for (const file of files) {
      try {
        const module: object = await import(pathToFileURL(path.join(file.parentPath, file.name)).href);
        for (const attr of Object.values(module)) {
          if (isDefined(getMinaPlayPluginMetadata(attr)?.id)) {
            plugins.push([attr, file]);
          }
        }
      } catch (error) {
        this.logger.error(`Error occurred while loading plugin file: ${file.name}`, error.stack, PluginService.name);
      }
    }

    return plugins;
  }

  async registerPlugin(plugin: Type, path?: string) {
    const metadata = getMinaPlayPluginMetadata(plugin);
    if (this.getControlById(metadata.id)) {
      this.logger.error(`Error occurred while creating plugin instance: Duplicated plugin id '${metadata.id}'`);
      return;
    }

    try {
      const control = new PluginControl({
        id: metadata.id,
        icon: metadata.icon,
        version: metadata.version,
        supportVersion: metadata.supportVersion,
        description: metadata.description,
        author: metadata.author,
        repo: metadata.repo,
        license: metadata.license,
        enabled: true,
        type: plugin,
        path,
        contexts: new Map(),
      });
      this.controls.push(control);

      if (metadata.supportVersion && !semver.satisfies(MINAPLAY_VERSION, metadata.supportVersion)) {
        this.logger.warn(
          `Plugin ${control.id}(${control.version ?? 'Unknown version'}) has unmet MinaPlay version '${
            control.supportVersion
          }'`,
        );
      }

      // initialize services
      control.module = await this.lazyModuleLoader.load(() => plugin, { logger: false });
      control.commands = [];
      control.listeners = [];
      control.services = [];
      control.parserMap = new Map();
      for (const provider of metadata.providers ?? []) {
        if (typeof provider === 'function') {
          // commands
          const commandsMetadata: MinaPlayCommandMetadata[] =
            Reflect.getMetadata(MINAPLAY_COMMAND_METADATA, provider) ?? [];
          for (const commandMetadata of commandsMetadata) {
            const parentHandler = commandMetadata.parent?.();
            const parent = parentHandler && commandsMetadata.find(({ handler }) => handler === parentHandler);
            if (parent) {
              parent.subcommands.push(commandMetadata);
            }
          }
          control.commands.push(...commandsMetadata.filter(({ parent }) => !isDefined(parent)));

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

          const parserMetadata = getMinaPlayPluginParserMetadata(service.constructor);
          if (isDefined(parserMetadata?.name) && isDefined(parserMetadata?.features)) {
            control.parserMap.set(parserMetadata.name, {
              ...parserMetadata,
              service,
            });
          }
        }
      }

      // emit onInit
      await this.emit(control, 'onPluginInit');

      // logs
      this.logger.log(`Plugin '${metadata.id}(${metadata.version ?? 'unknown version'})' registered`);
      const bins = control.commands.map(({ bin }) => bin);
      if (bins.length > 0) {
        this.logger.log(
          `Plugin '${metadata.id}' registered command { ${bins.length > 1 ? bins.join(', ') : bins[0]} }`,
        );
      }
      const parsers = control.parsers.map(({ name }) => name);
      if (parsers.length > 0) {
        this.logger.log(
          `Plugin '${metadata.id}' registered parser { ${parsers.length > 1 ? parsers.join(', ') : parsers[0]} }`,
        );
      }

      return control;
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
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    for (const [type] of await this.findPlugins(path.join(__dirname, './builtin'))) {
      await this.registerPlugin(type);
    }

    // register plugins in data dir
    for (const [type, file] of await this.findPlugins(PLUGIN_DIR)) {
      const pluginPath = isEmpty(path.relative(PLUGIN_DIR, file.path)) ? path.join(file.path, file.name) : file.path;
      await this.registerPlugin(type, pluginPath);
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

  async toggleEnabled(control: PluginControl, enabled: boolean) {
    if (control.enabled !== enabled) {
      control.enabled = enabled;
      await this.emit(control, control.enabled ? 'onPluginEnabled' : 'onPluginDisabled');
    }
  }

  async uninstall(control: PluginControl) {
    if (control.isBuiltin) {
      return [];
    }

    const controls = this.controls.filter(({ path }) => path === control.path);
    for (const control of controls) {
      await this.toggleEnabled(control, false);
      await this.emit(control, 'onPluginUninstall');
    }

    try {
      const stat = await fs.stat(control.path);
      if (stat.isFile()) {
        await fs.unlink(control.path);
      } else if (stat.isDirectory()) {
        await fs.rm(control.path, { recursive: true, force: true });
      }
    } catch (error) {
      this.logger.error(`Cannot uninstall plugin at '${control.path}'`, error.stack, PluginService.name);
    }

    this.controls = this.controls.filter(({ path }) => path !== control.path);
    return controls;
  }

  async emitParserAction<T extends keyof PluginSourceParser>(
    parser: PluginSourceParser,
    action: T,
    ...args: Parameters<PluginSourceParser[T]>
  ): Promise<ReturnType<PluginSourceParser[T]>> {
    try {
      return await parser[action].apply(parser, args);
    } catch (error) {
      const { name } = getMinaPlayPluginParserMetadata(parser.constructor);
      this.logger.error(
        `Error occurred while invoking parser action '${action}' on parser '${name}'`,
        error.stack,
        PluginService.name,
      );
    }
  }

  async handleGatewayMessage(message: MinaPlayMessage, socket: Socket, locale?: string) {
    const contexts = this.enabledPluginControls.map((control) => {
      const context = control.contexts.get(socket.data.user.id) ?? new PluginListenerContext(socket.data.user, control);
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
        await context.handleMessage(message, locale);
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
