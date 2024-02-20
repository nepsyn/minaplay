import { Injectable, OnModuleInit } from '@nestjs/common';
import os from 'node:os';
import { DATA_DIR } from '../../constants.js';
import process from 'node:process';
import { check } from 'diskusage';
import path from 'node:path';
import fastFolderSize from 'fast-folder-size';
import { promisify } from 'node:util';

@Injectable()
export class SystemService implements OnModuleInit {
  public startAt: Date;

  static getFolderSize = promisify(fastFolderSize);

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
}
