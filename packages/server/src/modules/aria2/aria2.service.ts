import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { Aria2DownloadTask } from './aria2-download-task.js';
import { CACHE_MANAGER, CacheStore } from '@nestjs/cache-manager';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { ARIA2_MODULE_OPTIONS_TOKEN } from './aria2.module-definition.js';
import { Aria2ModuleOptions } from './aria2.module.interface.js';
import { ARIA2_DOWNLOAD_DIR } from '../../constants.js';
import fs from 'fs-extra';
import { FileService } from '../file/file.service.js';
import { generateMD5 } from '../../utils/generate-md5.util.js';
import path from 'node:path';
import fetch from 'node-fetch';
import { FileSourceEnum } from '../../enums/file-source.enum.js';
import { File } from '../file/file.entity.js';
import { randomUUID } from 'node:crypto';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { Aria2WsClient } from './aria2.ws-client.js';
import { isDefined } from 'class-validator';
import { ApplicationLogger } from '../../common/application.logger.service.js';
import { fileTypeFromFile } from 'file-type';

@Injectable()
export class Aria2Service implements OnModuleInit {
  private client: Aria2WsClient;

  private tasks: Map<string, Aria2DownloadTask> = new Map();

  private static TRACKER_CACHE_KEY = 'aria2:trackers';
  private logger = new ApplicationLogger(Aria2Service.name);

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

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async autoClean() {
    if (this.isActive) {
      await this.purgeDownloadResult();
    }
  }

  get isActive() {
    return isDefined(this.client) && this.client.conn.readyState === this.client.conn.OPEN;
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
    const status = await this.client.tellStatus(gid);
    const parentGid = typeof status.following === 'string' ? status.following : gid;
    const task = this.tasks.get(parentGid);
    if (task) {
      const files: File[] = [];
      for (const file of status.files) {
        const fileStat = await fs.stat(file.path);
        const fileType = await fileTypeFromFile(file.path);
        const filename = path.basename(file.path);
        const record = await this.fileService.save({
          size: fileStat.size,
          filename: filename,
          name: filename,
          md5: await generateMD5(fs.createReadStream(file.path)),
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

  async createTask(url: string) {
    const hash = await generateMD5(String(Date.now()));
    const gid = hash.slice(0, 16);
    const task = new Aria2DownloadTask(gid, url);
    this.tasks.set(task.gid, task);

    return task;
  }

  async startTask(task: Aria2DownloadTask) {
    const tracker = await this.cacheStore.get<string>(Aria2Service.TRACKER_CACHE_KEY);
    try {
      await this.client.addUri([task.url], {
        'bt-tracker': tracker ?? '',
        dir: path.join(ARIA2_DOWNLOAD_DIR, randomUUID().replace(/-/g, '')),
        gid: task.gid,
      });

      return true;
    } catch {
      return false;
    }
  }

  async tellStatus(gid: string): ReturnType<Aria2WsClient['tellStatus']> {
    const {
      completedLength,
      connections,
      downloadSpeed,
      errorCode,
      errorMessage,
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
          downloadSpeed,
          errorCode,
          errorMessage,
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
    const group = tasks.filter(
      (task) => task.gid === gid || task.following === gid || [].concat(task.following).includes(gid),
    );
    for (const task of group) {
      try {
        await this.client.remove(task.gid);
      } catch {}
    }
    this.tasks.delete(gid);
  }

  async purgeDownloadResult() {
    await this.client.purgeDownloadResult();
  }

  private async updateBtTrackers() {
    try {
      const response = await fetch(this.options.trackerListUrl, {
        agent: this.options.httpProxy && new HttpsProxyAgent(this.options.httpProxy),
      });
      const rawText = await response.text();
      const tracker = rawText.replace(/\s+/g, ',');
      await this.cacheStore.set(Aria2Service.TRACKER_CACHE_KEY, tracker);
    } catch (error) {
      this.logger.error('Aria2 update trackers failed', error.stack, Aria2Service.name);
    }
  }
}
