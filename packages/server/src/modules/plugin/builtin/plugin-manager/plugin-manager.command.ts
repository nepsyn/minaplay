import { Injectable } from '@nestjs/common';
import {
  MinaPlayCommand,
  MinaPlayCommandArgument,
  MinaPlayCommandOption,
  MinaPlayPluginInject,
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
import { PluginChatContext } from '../../plugin-chat-context.js';
import { Action } from '../../../../common/messages/action.js';
import { Timeout } from '../../../../common/messages/timeout.js';
import { Consumed } from '../../../../common/messages/consumed.js';
import { ConsumableGroup } from '../../../../common/messages/consumable-group.js';

@Injectable()
export class PluginManagerCommand {
  constructor(private pluginService: PluginService, private configService: ConfigService) {}

  @MinaPlayCommand('pm', {
    description: 'manage plugins in MinaPlay',
  })
  async handlePm(@MinaPlayPluginInject() program: Command) {
    return program.helpInformation();
  }

  @MinaPlayCommand('enable', {
    parents: ['pm'],
  })
  async handleEnable(
    @MinaPlayCommandArgument('<id>', {
      description: 'plugin ID',
    })
    id: string,
  ) {
    const plugin = this.pluginService.getControlById(id);
    if (!plugin) {
      return new Text(`Plugin '${id}' not found in MinaPlay`, Text.Colors.ERROR);
    }

    await this.pluginService.toggleEnabled(id, true);
    return new Text(`Plugin '${id}' enabled`, Text.Colors.SUCCESS);
  }

  @MinaPlayCommand('disable', {
    parents: ['pm'],
  })
  async handleDisable(
    @MinaPlayCommandArgument('<id>', {
      description: 'plugin ID',
    })
    id: string,
  ) {
    const plugin = this.pluginService.getControlById(id);
    if (!plugin) {
      return new Text(`Plugin '${id}' not found in MinaPlay`, Text.Colors.ERROR);
    }

    await this.pluginService.toggleEnabled(id, false);
    return new Text(`Plugin '${id}' disabled`, Text.Colors.SUCCESS);
  }

  @MinaPlayCommand('install', {
    parents: ['pm'],
  })
  async handleInstall(
    @MinaPlayCommandArgument('<id>', {
      description: 'plugin ID',
    })
    id: string,
    @MinaPlayCommandOption('-r,--registry', {
      description: 'Registry url',
      default: 'https://registry.npmjs.com',
    })
    registry: string,
    @MinaPlayCommandOption('-i,--ignore-prefix', {
      description: 'Ignore MinaPlay plugin package prefix',
      default: false,
    })
    ignorePrefix: boolean,
    @MinaPlayPluginInject() chat: PluginChatContext,
  ) {
    const plugin = this.pluginService.getControlById(id);
    if (plugin) {
      return new Text(`Plugin '${id}' was already registered in MinaPlay`, Text.Colors.ERROR);
    }

    try {
      const proxyUrl = this.configService.get('APP_HTTP_PROXY');
      const packageId = ignorePrefix ? id : `minaplay-plugin-${id}`;
      const metadataResponse = await fetch(`${registry}/${packageId}/latest`, {
        agent: proxyUrl && new HttpsProxyAgent(proxyUrl),
      });

      if (metadataResponse.status === 404) {
        return new Text(`Plugin package '${packageId}' not found in registry`, Text.Colors.ERROR);
      }

      const data = await metadataResponse.json();
      const groupId = Date.now().toString();
      await chat.send([
        new Text(`Find package '${packageId}' , install it now? (Y/n)`),
        new ConsumableGroup(groupId, [
          new Consumed(groupId),
          new Action('yes', new Text('Yes')),
          new Action('no', new Text('No')),
          new Action('cancel', new Text('Cancel')),
          new Timeout(30000),
        ]),
      ]);
      try {
        const resp = await chat.receive(30000);
        if (resp.type !== 'ConsumableFeedback' || resp.id !== groupId || resp.value !== 'yes') {
          return [new Consumed(groupId), new Text(`Install '${packageId}' canceled`)];
        }
      } catch {
        return [new Consumed(groupId), new Text(`Install '${packageId}' canceled`)];
      }
      await chat.send(new Consumed(groupId));

      const tarballDownloadPath = data['dist']['tarball'];
      const tarballResponse = await fetch(tarballDownloadPath, {
        agent: proxyUrl && new HttpsProxyAgent(proxyUrl),
      });
      const dir = path.join(PLUGIN_DIR, id);
      await fs.ensureDir(dir);
      await compressing.tgz.decompress(Buffer.from(await tarballResponse.arrayBuffer()), dir);
      const plugins = await this.pluginService.findPlugins(dir);
      if (plugins.length > 0) {
        for (const plugin of plugins) {
          await this.pluginService.registerPlugin(plugin);
        }
        return new Text(`Plugin package '${packageId}' installed`, Text.Colors.SUCCESS);
      } else {
        return new Text(`Cannot find valid MinaPlay plugin in package '${packageId}'`, Text.Colors.WARNING);
      }
    } catch (error) {
      return new Text(`Install plugin '${id}' error: ${error.message}`, Text.Colors.ERROR);
    }
  }
}
