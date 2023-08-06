import { Injectable, OnModuleInit } from '@nestjs/common';
import os from 'node:os';
import process from 'process';
import { importESM } from '../../utils/import-esm.util';
import { RESOURCE_DIR } from '../../constants';
import checkDiskSpace from 'check-disk-space';

@Injectable()
export class SystemService implements OnModuleInit {
  public startAt: Date;

  async onModuleInit() {
    this.startAt = new Date();
  }

  async getMemoryUsage() {
    return {
      total: os.totalmem(),
      used: process.memoryUsage().rss,
    };
  }

  async getDiskUsage() {
    const getFolderSize = (await importESM<typeof import('get-folder-size')>('get-folder-size')).default.loose;

    const diskSpace = await checkDiskSpace(RESOURCE_DIR);
    return {
      disk: diskSpace.diskPath,
      total: diskSpace.size,
      used: await getFolderSize(RESOURCE_DIR),
    };
  }
}
