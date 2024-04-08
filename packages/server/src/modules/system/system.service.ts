import { Injectable, OnApplicationBootstrap, OnModuleInit } from '@nestjs/common';
import os from 'node:os';
import { DATA_DIR, MINAPLAY_VERSION } from '../../constants.js';
import process from 'node:process';
import { check } from 'diskusage';
import path from 'node:path';
import fastFolderSize from 'fast-folder-size';
import { promisify } from 'node:util';
import { ConfigService } from '@nestjs/config';
import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { ApplicationLogger } from '../../common/application.logger.service.js';
import semver from 'semver';

@Injectable()
export class SystemService implements OnModuleInit, OnApplicationBootstrap {
  public startAt: Date;

  static getFolderSize = promisify(fastFolderSize);

  constructor(private configService: ConfigService) {}

  onApplicationBootstrap() {
    const logger = new ApplicationLogger('MinaPlay');
    this.checkUpdate()
      .then(({ current, latest }) => {
        if (semver.gt(latest, current)) {
          logger.warn(`New version of MinaPlay v${latest} founded, You are running version v${current}`);
        } else {
          logger.log(`You are running the latest version of MinaPlay`);
        }
      })
      .catch((error) => {
        logger.error(`Unable to check for updates of MinaPlay`, error.stack, 'MinaPlay');
      });
  }

  async onModuleInit() {
    this.startAt = new Date();
  }

  async getMemoryUsage() {
    return {
      total: os.totalmem(),
      free: os.freemem(),
      used: process.memoryUsage().rss,
    };
  }

  async getDiskUsage() {
    const diskSpace = await check(DATA_DIR);
    return {
      disk: path.parse(DATA_DIR).root,
      total: diskSpace.total,
      free: diskSpace.available,
      used: await SystemService.getFolderSize(path.join(DATA_DIR, '..')),
    };
  }

  async checkUpdate() {
    const proxyUrl = process.env.HTTP_PROXY ?? this.configService.get('APP_HTTP_PROXY');
    const packageResponse = await fetch('https://registry.npmjs.com/@minaplay/server/latest', {
      agent: proxyUrl && new HttpsProxyAgent(proxyUrl),
    });
    const data = (await packageResponse.json()) as { version: string };
    return {
      current: MINAPLAY_VERSION,
      latest: data.version,
    };
  }
}
