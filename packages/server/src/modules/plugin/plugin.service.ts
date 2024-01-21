import { Injectable, OnModuleInit, Type } from '@nestjs/common';
import { LazyModuleLoader } from '@nestjs/core';
import { MinaPlayCommandResult, MinaPlayPluginHooks, PluginCommandMetadata } from './plugin.interface.js';
import { PluginControl } from './plugin-control.js';
import { getMinaPlayPluginMetadata, isMinaPlayPlugin } from './plugin.decorator.js';
import { ApplicationLogger } from '../../common/application.logger.service.js';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import fs from 'fs-extra';
import { MINAPLAY_COMMAND_KEY } from './plugin-command.decorator.js';
import { Argument, CommanderError, Option } from 'commander';
import { isString } from 'class-validator';
import { Text } from '../../common/application.message.js';

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
      const commands: Map<string, PluginCommandMetadata> = new Map();
      const services: MinaPlayPluginHooks[] = [];
      for (const provider of metadata.providers ?? []) {
        if (typeof provider === 'function') {
          // commands
          const commandsMetadata: Map<string, PluginCommandMetadata> = Reflect.getMetadata(
            MINAPLAY_COMMAND_KEY,
            provider,
          );
          if (commandsMetadata) {
            for (const [bin, commandMetadata] of commandsMetadata.entries()) {
              commands.set(bin, commandMetadata);
              this.logger.log(`Plugin '${metadata.id}' registered command '${bin}'`);
            }
          }

          const service = await module.get(provider);
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

  getCommandMetadataAndArgv(command: string, control: PluginControl) {
    let root = control.commands;
    let metadata: PluginCommandMetadata | undefined = undefined;
    const argv = command.split(/\s+/);
    for (const arg of argv.concat()) {
      if (root.has(arg)) {
        metadata = root.get(arg);
        root = root.get(arg).subcommands;
        argv.shift();
      } else {
        break;
      }
    }
    return [metadata, argv] as const;
  }

  async runCommand(command: string): Promise<MinaPlayCommandResult[]> {
    const results: MinaPlayCommandResult[] = [];
    for (const control of this.enabledPluginControls) {
      const [metadata, argv] = this.getCommandMetadataAndArgv(command, control);
      if (metadata) {
        const service = await control.module.get(metadata.type);

        try {
          const program = metadata.program.parse(argv, { from: 'user' });
          const opts = program.opts();
          const args = program.processedArgs.concat();
          const params = [];
          metadata.args.concat().forEach(({ index, instance }) => {
            if (instance instanceof Argument) {
              params[index] = args.shift();
            } else if (instance instanceof Option) {
              params[index] = opts[instance.attributeName()];
            } else {
              params[index] = program;
            }
          });

          let messages = await service[metadata.key](...params);
          if (isString(messages)) {
            messages = [Object.assign(new Text(), { type: 'Text', content: messages })];
          } else if (messages.type) {
            messages = [messages];
          }

          results.push({
            control,
            result: messages,
          });
        } catch (error) {
          if (error instanceof CommanderError) {
            if (['commander.help', 'commander.helpDisplayed'].includes(error.code)) {
              results.push({
                control,
                result: [Object.assign(new Text(), { type: 'Text', content: metadata.program.helpInformation() })],
              });
            } else {
              results.push({
                control,
                error: error.message,
              });
            }
          } else {
            this.logger.error(
              `Error occurred while running command '${command}' on plugin '${control.id}'`,
              error.stack,
              PluginService.name,
            );
          }
        }
      }
    }

    return results;
  }

  getAllControls() {
    return this.controls;
  }

  getControl(id: string) {
    return this.controls.find((control) => control.id === id);
  }
}
