import { Injectable, OnModuleInit } from '@nestjs/common';
import os from 'node:os';
import { DATA_DIR } from '../../constants.js';
import checkDiskSpace from 'check-disk-space';
import getFolderSize from 'get-folder-size';
import process from 'node:process';

@Injectable()
export class SystemService implements OnModuleInit {
  public startAt: Date;

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
    // @ts-ignore
    const diskSpace = await checkDiskSpace(DATA_DIR);
    return {
      disk: diskSpace.diskPath,
      total: diskSpace.size,
      free: diskSpace.free,
      // @ts-ignore
      used: await getFolderSize.loose(DATA_DIR),
    };
  }
}
