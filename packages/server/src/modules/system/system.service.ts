import { Injectable, OnModuleInit } from '@nestjs/common';
import os from 'node:os';
import process from 'node:process';
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
      free: os.freemem(),
      used: process.memoryUsage().rss,
    };
  }

  async getDiskUsage() {
    const { default: GetFolderSize } = await importESM<typeof import('get-folder-size')>('get-folder-size');

    const diskSpace = await checkDiskSpace(RESOURCE_DIR);
    return {
      disk: diskSpace.diskPath,
      total: diskSpace.size,
      free: diskSpace.free,
      used: await GetFolderSize.loose(RESOURCE_DIR),
    };
  }
}
