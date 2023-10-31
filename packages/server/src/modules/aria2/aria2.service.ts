import { ConsoleLogger, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { Aria2DownloadTask } from './aria2-download-task';
import { CACHE_MANAGER, CacheStore } from '@nestjs/cache-manager';
import { CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { ARIA2_MODULE_OPTIONS_TOKEN } from './aria2.module-definition';
import { Aria2ModuleOptions } from './aria2.module.interface';
import { ARIA2_DOWNLOAD_DIR } from '../../constants';
import { createReadStream, stat } from 'fs-extra';
import { FileService } from '../file/file.service';
import { generateMD5 } from '../../utils/generate-md5.util';
import path from 'path';
import { FileSourceEnum } from '../../enums/file-source.enum';
import { File } from '../file/file.entity';
import { importESM } from '../../utils/import-esm.util';
import { randomUUID } from 'crypto';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { Aria2WsClient } from './aria2.ws-client';

@Injectable()
export class Aria2Service implements OnModuleInit {
  private client: Aria2WsClient;

  private tasks: Map<string, Aria2DownloadTask> = new Map();

  private static TRACKER_CACHE_KEY = 'aria2-tracker';
  private logger = new ConsoleLogger(Aria2Service.name);

  constructor(
    @Inject(ARIA2_MODULE_OPTIONS_TOKEN) private options: Aria2ModuleOptions,
    @Inject(CACHE_MANAGER) private cacheStore: CacheStore,
    private scheduleRegistry: SchedulerRegistry,
    private fileService: FileService,
  ) {}

  async onModuleInit() {
    await this.connectWs();

    if (this.options.autoUpdateTracker) {
      const job = CronJob.from({
        cronTime: CronExpression.EVERY_12_HOURS,
        onTick: async () => {
          await this.updateBtTrackers();
        },
        runOnInit: true,
      });
      this.scheduleRegistry.addCronJob('auto-update-trackers', job);
    }
  }

  private async connectWs() {
    this.client = new Aria2WsClient({
      host: this.options.rpcHost,
      port: this.options.rpcPort,
      path: this.options.rpcPath,
      auth: {
        secret: this.options.rpcSecret,
      },
    });

    this.client.on('ws.close', () => {
      this.logger.error('Aria2 WS connection closed, reconnect in 5 seconds');
      setTimeout(() => this.connectWs(), 5000);
    });
    this.client.conn.onerror = (event) => {
      this.logger.error(event.error);
    };

    const info = await this.client.getVersion();
    this.logger.log(`Aria2 service is running, version=${info.version}`);

    this.client.on('aria2.onDownloadComplete', this.onDownloadComplete.bind(this));
    this.client.on('aria2.onDownloadError', this.onDownloadError.bind(this));
  }

  private async onDownloadComplete({ gid }: { gid: string }) {
    const { fileTypeFromFile } = await importESM<typeof import('file-type')>('file-type');

    const status = await this.client.tellStatus(gid);
    const parentGid = typeof status.following === 'string' ? status.following : gid;
    const task = this.tasks.get(parentGid);
    if (task) {
      const files: File[] = [];
      for (const file of status.files) {
        const fileStat = await stat(file.path);
        const fileType = await fileTypeFromFile(file.path);
        const filename = path.basename(file.path);
        const record = await this.fileService.save({
          size: fileStat.size,
          filename: filename,
          name: filename,
          md5: await generateMD5(createReadStream(file.path)),
          mimetype: fileType && fileType.mime,
          source: FileSourceEnum.ARIA2_DOWNLOAD,
          path: file.path,
        });
        files.push(record);
      }

      if (status.following || !status.followedBy) {
        task.emit('complete', files);
        this.tasks.delete(parentGid);
      }
    }
  }

  private async onDownloadError({ gid }: { gid: string }) {
    const status = await this.client.tellStatus(gid);
    const parentGid = typeof status.following === 'string' ? status.following : gid;
    const task = this.tasks.get(parentGid);
    if (task) {
      task.emit('error', status);
      this.tasks.delete(parentGid);
    }
  }

  async addTask(url: string) {
    const tracker = await this.cacheStore.get<string>(Aria2Service.TRACKER_CACHE_KEY);
    const gid = await this.client.addUri([url], {
      'bt-tracker': tracker ?? '',
      dir: path.join(ARIA2_DOWNLOAD_DIR, randomUUID().replace(/-/g, '')),
    });
    const task = new Aria2DownloadTask(gid);
    this.tasks.set(gid, task);

    return task;
  }

  async tellStatus(gid: string): ReturnType<Aria2WsClient['tellStatus']> {
    const {
      completedLength,
      connections,
      dir,
      downloadSpeed,
      errorCode,
      errorMessage,
      files,
      followedBy,
      following,
      infoHash,
      status,
      totalLength,
      belongsTo,
    } = await this.client.tellStatus(gid);

    return JSON.parse(
      JSON.stringify(
        {
          gid,
          completedLength,
          connections,
          dir,
          downloadSpeed,
          errorCode,
          errorMessage,
          files,
          followedBy,
          following,
          infoHash,
          status,
          totalLength,
          belongsTo,
        },
        (_, value) => {
          return typeof value === 'bigint' ? value.toString() : value;
        },
      ),
    );
  }

  async tellActive(): ReturnType<Aria2WsClient['tellActive']> {
    return await this.client.tellActive();
  }

  async tellWaiting(): ReturnType<Aria2WsClient['tellWaiting']> {
    return await this.client.tellWaiting(0, 1024);
  }

  async pauseBy(gid: string) {
    const tasks = await this.tellActive();
    const group = tasks.filter((task) => task.gid === gid || task.following === gid || task.following?.includes(gid));
    for (const task of group) {
      try {
        await this.client.pause(task.gid);
      } catch {}
    }
  }

  async unpauseBy(gid: string) {
    const tasks = await this.tellWaiting();
    const group = tasks.filter((task) => task.gid === gid || task.following === gid || task.following?.includes(gid));
    for (const task of group) {
      try {
        await this.client.unpause(task.gid);
      } catch {}
    }
  }

  async removeBy(gid: string) {
    const tasks = [...(await this.tellActive()), ...(await this.tellWaiting())];
    const group = tasks.filter((task) => task.gid === gid || task.following === gid || task.following?.includes(gid));
    for (const task of group) {
      try {
        await this.client.remove(task.gid);
      } catch {}
    }
  }

  async purgeDownloadResult() {
    await this.client.purgeDownloadResult();
  }

  private async updateBtTrackers() {
    const { default: fetch } = await importESM<typeof import('node-fetch')>('node-fetch');
    try {
      const response = await fetch(this.options.trackerListUrl, {
        agent: this.options.httpProxy && new HttpsProxyAgent(this.options.httpProxy),
      });
      const rawText = await response.text();
      const tracker = rawText.replace(/\s+/g, ',');
      await this.cacheStore.set(Aria2Service.TRACKER_CACHE_KEY, tracker);
    } catch (error) {
      this.logger.error('Aria2 update trackers failed', error.stack);
    }
  }
}
