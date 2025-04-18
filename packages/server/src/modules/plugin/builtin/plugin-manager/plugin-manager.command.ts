import { Injectable } from '@nestjs/common';
import {
  MinaPlayCommand,
  MinaPlayCommandArgument,
  MinaPlayCommandOption,
  MinaPlayListenerInject,
} from '../../plugin.decorator.js';
import { Command } from 'commander';
import { PluginService } from '../../plugin.service.js';
import { Text } from '../../../../common/messages/text.js';
import { ConfigService } from '@nestjs/config';
import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';
import fs from 'fs-extra';
import path from 'node:path';
import { PLUGIN_DIR } from '../../../../constants.js';
import * as compressing from 'compressing';
import { PluginChat } from '../../plugin-listener-context.js';
import { Action } from '../../../../common/messages/action.js';
import { Timeout } from '../../../../common/messages/timeout.js';
import { Consumed } from '../../../../common/messages/consumed.js';
import { ConsumableGroup, Pending } from '../../../../common/messages/index.js';
import { execaCommand } from 'execa';
import process from 'node:process';
import semver from 'semver';
import { MinaPlayMessage } from '../../../../common/application.message.js';

@Injectable()
export class PluginManagerCommand {
  constructor(private pluginService: PluginService, private configService: ConfigService) {}

  @MinaPlayCommand('pm', {
    aliases: ['plugin-manager'],
    description: 'manage plugins in MinaPlay',
  })
  async handlePm(@MinaPlayListenerInject() program: Command) {
    return program.helpInformation();
  }

  @MinaPlayCommand('enable', {
    aliases: ['e'],
    description: 'enable a plugin in MinaPlay',
    parent: () => PluginManagerCommand.prototype.handlePm,
  })
  async handleEnable(
    @MinaPlayCommandArgument('<id>', {
      description: 'plugin ID',
    })
    id: string,
  ) {
    const plugin = this.pluginService.getControlById(id) ?? this.pluginService.getControlByPackageId(id);
    if (!plugin) {
      return new Text(`Plugin '${id}' not found in MinaPlay`, Text.Colors.ERROR);
    }

    await this.pluginService.toggleEnabled(plugin, true);
    return new Text(`Plugin '${id}' enabled`, Text.Colors.SUCCESS);
  }

  @MinaPlayCommand('disable', {
    aliases: ['d'],
    description: 'disable a plugin in MinaPlay',
    parent: () => PluginManagerCommand.prototype.handlePm,
  })
  async handleDisable(
    @MinaPlayCommandArgument('<id>', {
      description: 'plugin ID',
    })
    id: string,
  ) {
    const plugin = this.pluginService.getControlById(id) ?? this.pluginService.getControlByPackageId(id);
    if (!plugin) {
      return new Text(`Plugin '${id}' not found in MinaPlay`, Text.Colors.ERROR);
    }

    await this.pluginService.toggleEnabled(plugin, false);
    return new Text(`Plugin '${id}' disabled`, Text.Colors.SUCCESS);
  }

  @MinaPlayCommand('dump', {
    aliases: ['du'],
    description: 'dump info of a MinaPlay plugin',
    parent: () => PluginManagerCommand.prototype.handlePm,
  })
  async handleDump(
    @MinaPlayCommandArgument('<id>', {
      description: 'plugin ID',
    })
    id: string,
  ) {
    const plugin = this.pluginService.getControlById(id) ?? this.pluginService.getControlByPackageId(id);
    if (!plugin) {
      return new Text(`Plugin '${id}' not found in MinaPlay`, Text.Colors.ERROR);
    }

    const result = [new Text(`Dump info of plugin ${plugin.id}`, Text.Colors.INFO)];
    for (const key of Object.keys(plugin.metadata)) {
      if (plugin.metadata[key]) {
        const field = key
          .replace(/([A-Z])/g, ' $1')
          .toUpperCase()
          .padEnd(20, ' ');
        result.push(new Text(`${field} : ${plugin.metadata[key]}`));
      }
    }
    if (plugin.path) {
      result.push(new Text(`${'INSTALL PATH'.padEnd(20, ' ')} : ${plugin.path}`));
    }
    return result;
  }

  @MinaPlayCommand('install', {
    aliases: ['add', 'i'],
    description: 'install a MinaPlay plugin in NPM registry',
    parent: () => PluginManagerCommand.prototype.handlePm,
  })
  async handleInstall(
    @MinaPlayCommandArgument('<id>', {
      description: 'plugin ID',
    })
    id: string,
    @MinaPlayCommandOption('-r,--registry <url>', {
      description: 'Registry url',
      default: 'https://registry.npmjs.com',
    })
    registry: string,
    @MinaPlayCommandOption('-I,--ignore-prefix', {
      description: 'Ignore MinaPlay plugin package prefix',
      default: false,
    })
    ignorePrefix: boolean,
    @MinaPlayCommandOption('-y,--yes', {
      description: 'Skip install confirmation',
      default: false,
    })
    yes: boolean,
    @MinaPlayListenerInject() chat: PluginChat,
  ) {
    const atIndex = id.lastIndexOf('@');
    const name = atIndex >= 0 ? id.slice(0, atIndex) : id;
    let version = atIndex >= 0 ? id.slice(atIndex + 1, id.length) : 'latest';
    const packageId = ignorePrefix ? name : `minaplay-plugin-${name}`;

    const groupId = Date.now().toString();
    try {
      const proxyUrl = process.env.HTTP_PROXY ?? this.configService.get('APP_HTTP_PROXY');
      const metadataResponse = await fetch(`${registry}/${packageId}/${version}`, {
        agent: proxyUrl && new HttpsProxyAgent(proxyUrl),
      });
      if (metadataResponse.status === 404) {
        return new Text(`Plugin package '${packageId}@${version}' not found in registry`, Text.Colors.ERROR);
      }
      const data = await metadataResponse.json();
      version = data['version'];

      const plugin = ignorePrefix
        ? this.pluginService.getControlByPackageId(name)
        : this.pluginService.getControlById(name);
      if (plugin) {
        const currentTag = `${name}${plugin.version ? `(${plugin.version})` : ''}`;
        if (!yes) {
          await chat.send([
            new Text(`Plugin '${currentTag}' was already installed in MinaPlay, uninstall it? (Y/n)`),
            new ConsumableGroup(groupId, [
              new Action('yes', new Text('Yes')),
              new Action('no', new Text('No')),
              new Action('cancel', new Text('Cancel')),
              new Timeout(30000),
            ]),
          ]);
          try {
            const resp = await chat.receive(30000);
            if (resp.type !== 'Text' || !['yes', 'y'].includes(resp.content.toLowerCase())) {
              return [new Consumed(groupId), new Text(`Uninstall '${currentTag}' canceled`)];
            }
          } catch {
            return [new Consumed(groupId), new Text(`Uninstall '${currentTag}' canceled`)];
          }
          await chat.send(new Consumed(groupId));
        }
        await chat.send(
          new ConsumableGroup(groupId, [new Text(`Uninstalling plugin '${currentTag}' ...`), new Pending()]),
        );
        await this.pluginService.uninstall(plugin);
        await chat.send(new Consumed(groupId));
      }

      if (!yes) {
        await chat.send([
          new Text(`Find package '${packageId}@${version}' , install it now? (Y/n)`),
          new ConsumableGroup(groupId, [
            new Action('yes', new Text('Yes')),
            new Action('no', new Text('No')),
            new Action('cancel', new Text('Cancel')),
            new Timeout(30000),
          ]),
        ]);
        try {
          const resp = await chat.receive(30000);
          if (resp.type !== 'Text' || !['yes', 'y'].includes(resp.content.toLowerCase())) {
            return [new Consumed(groupId), new Text(`Install '${packageId}@${version}' canceled`)];
          }
        } catch {
          return [new Consumed(groupId), new Text(`Install '${packageId}@${version}' canceled`)];
        }
        await chat.send(new Consumed(groupId));
      }

      await chat.send(
        new ConsumableGroup(groupId, [new Text(`Installing plugin '${packageId}@${version}' ...`), new Pending()]),
      );
      const tarballDownloadPath = data['dist']['tarball'];
      const tarballResponse = await fetch(tarballDownloadPath, {
        agent: proxyUrl && new HttpsProxyAgent(proxyUrl),
      });
      const downloadDir = path.join(PLUGIN_DIR, `.${packageId}`);
      const destDir = path.join(PLUGIN_DIR, `${packageId}@${Date.now()}`);
      await compressing.tgz.decompress(Buffer.from(await tarballResponse.arrayBuffer()), downloadDir);
      await fs.move(path.join(downloadDir, 'package'), destDir, { overwrite: true });
      await fs.rmdir(downloadDir);
      await execaCommand('npm install --omit=dev --omit=peer', {
        cwd: destDir,
      });
      const plugins = await this.pluginService.findPlugins(destDir);
      if (plugins.length > 0) {
        const installedTexts: Text[] = [];
        for (const [type] of plugins) {
          const control = await this.pluginService.registerPlugin(type, destDir);
          if (control) {
            installedTexts.push(new Text(`Plugin '${control.id}' registered`, Text.Colors.SUCCESS));
          }
        }
        return [new Text(`Plugin package '${packageId}@${version}' installed`, Text.Colors.SUCCESS), ...installedTexts];
      } else {
        return [
          new Text(`Plugin package '${packageId}@${version}' installed`, Text.Colors.SUCCESS),
          new Text(`No valid MinaPlay plugin in package '${packageId}'`, Text.Colors.WARNING),
        ];
      }
    } catch (error) {
      return new Text(`Plugin '${name}' installation failed: ${error.message}`, Text.Colors.ERROR);
    } finally {
      await chat.send(new Consumed(groupId));
    }
  }

  @MinaPlayCommand('check-update', {
    aliases: ['cu'],
    description: 'check updates of MinaPlay plugins in NPM registry',
    parent: () => PluginManagerCommand.prototype.handlePm,
  })
  async handleCheckUpdate(
    @MinaPlayCommandArgument('<id>', {
      description: 'plugin ID',
    })
    id: string,
    @MinaPlayCommandOption('-r,--registry <url>', {
      description: 'Registry url',
      default: 'https://registry.npmjs.com',
    })
    registry: string,
    @MinaPlayListenerInject() chat: PluginChat,
  ) {
    const plugin = this.pluginService.getControlById(id) ?? this.pluginService.getControlByPackageId(id);
    if (!plugin) {
      return new Text(`Plugin '${id}' not found in MinaPlay`, Text.Colors.ERROR);
    }
    if (!plugin.package) {
      return new Text(`Plugin '${id}' has no 'package' field`, Text.Colors.ERROR);
    }

    const groupId = Date.now().toString();
    await chat.send(new ConsumableGroup(groupId, [new Text(`Checking update for plugin '${id}' ...`), new Pending()]));
    try {
      const proxyUrl = process.env.HTTP_PROXY ?? this.configService.get('APP_HTTP_PROXY');
      const metadataResponse = await fetch(`${registry}/${plugin.package}/latest`, {
        agent: proxyUrl && new HttpsProxyAgent(proxyUrl),
      });
      if (metadataResponse.status === 404) {
        return new Text(`Plugin package '${plugin.package}' not found in registry`, Text.Colors.ERROR);
      }
      const data = await metadataResponse.json();
      const version = data['version'];
      const result: MinaPlayMessage[] = [
        new Text(`Plugin '${id}' latest version: ${version}, current version: ${plugin.version}`),
      ];
      if (semver.eq(version, plugin.version)) {
        result.push(new Text(`Plugin '${id}' is up to date!`, Text.Colors.SUCCESS));
      } else {
        result.push(
          new Text(`Use \`pm install -I ${plugin.package}\` to update`, Text.Colors.INFO),
          new Action(`pm install -I ${plugin.package}`, new Text('Update to latest version')),
        );
      }
      return result;
    } catch (error) {
      return new Text(`Check update for plugin '${id}' failed: ${error.message}`, Text.Colors.ERROR);
    } finally {
      await chat.send(new Consumed(groupId));
    }
  }

  @MinaPlayCommand('uninstall', {
    aliases: ['remove', 'u'],
    description: 'uninstall a plugin in MinaPlay',
    parent: () => PluginManagerCommand.prototype.handlePm,
  })
  async handleUninstall(
    @MinaPlayCommandArgument('<id>', {
      description: 'plugin ID',
    })
    id: string,
    @MinaPlayCommandOption('-y,--yes', {
      description: 'Skip uninstall confirmation',
      default: false,
    })
    yes: boolean,
    @MinaPlayListenerInject() chat: PluginChat,
  ) {
    const plugin = this.pluginService.getControlById(id) ?? this.pluginService.getControlByPackageId(id);
    if (!plugin) {
      return new Text(`Plugin '${id}' not found in MinaPlay`, Text.Colors.ERROR);
    }
    if (plugin.isBuiltin) {
      return new Text(`Cannot uninstall builtin plugin '${id}'`, Text.Colors.ERROR);
    }

    const groupId = Date.now().toString();
    if (!yes) {
      await chat.send([
        new Text(`Uninstall plugin '${id}'? (Y/n)`),
        new ConsumableGroup(groupId, [
          new Action('yes', new Text('Yes', Text.Colors.ERROR)),
          new Action('no', new Text('No')),
          new Action('cancel', new Text('Cancel')),
          new Timeout(30000),
        ]),
      ]);
      try {
        const resp = await chat.receive(30000);
        if (resp.type !== 'Text' || !['yes', 'y'].includes(resp.content.toLowerCase())) {
          return [new Consumed(groupId), new Text(`Uninstall '${id}' canceled`)];
        }
      } catch {
        return [new Consumed(groupId), new Text(`Uninstall '${id}' canceled`)];
      }
    }

    await chat.send(new ConsumableGroup(groupId, [new Text(`Uninstalling plugin '${id}' ...`), new Pending()]));
    const plugins = await this.pluginService.uninstall(plugin);
    await chat.send([
      new Consumed(groupId),
      ...plugins.map(({ id }) => new Text(`Plugin '${id}' uninstalled`, Text.Colors.SUCCESS)),
    ]);
  }
}
