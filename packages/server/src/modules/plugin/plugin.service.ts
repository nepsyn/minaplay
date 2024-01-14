import { Injectable, OnModuleInit, Type } from '@nestjs/common';
import { LazyModuleLoader } from '@nestjs/core';
import { MinaPlayPluginHooks } from '../../interfaces/plugins.js';
import { PluginControl } from './plugin-control.js';
import { getMinaPlayPluginDescriptor, isMinaPlayPlugin } from '../../common/plugin.decorator.js';
import { ApplicationLogger } from '../../common/application.logger.service.js';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import fs from 'fs-extra';
import { plainToInstance } from 'class-transformer';

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

  async onModuleInit() {
    const plugins = await this.findPlugins();
    for (const plugin of plugins) {
      const descriptor = getMinaPlayPluginDescriptor(plugin);
      try {
        const module = await this.lazyModuleLoader.load(() => plugin);
        const services: MinaPlayPluginHooks[] = [];
        for (const provider of descriptor.providers ?? []) {
          if (typeof provider === 'function') {
            const service = await module.get(provider);
            services.push(service);
          }
        }

        const control = plainToInstance(PluginControl, {
          ...descriptor,
          enabled: true,
        });
        control.services = services;
        control.type = plugin;
        this.controls.push(control);

        this.logger.log(`Plugin '${descriptor.id}(${descriptor.version ?? 'unknown version'})' created`);
      } catch (error) {
        this.logger.error(
          `Error occurred while creating plugin instance: '${descriptor.id}'`,
          error.stack,
          PluginService.name,
        );
      }
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

  getAllControls() {
    return this.controls;
  }
}
