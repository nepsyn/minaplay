import { ConsoleLogger, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { Aria2DownloadTask } from './aria2-download-task';
import { CACHE_MANAGER, CacheStore } from '@nestjs/cache-manager';
import { CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { ARIA2_MODULE_OPTIONS_TOKEN } from './aria2.module-definition';
import { Aria2ModuleOptions } from './aria2.module.interface';
import { type _AsyncVersionOf } from 'async-call-rpc/src/types';
import { type Aria2, createClient } from 'a2c';
import { Aria2WsMessage } from './aria2-ws.interface';
import { MessageEvent, WebSocket } from 'ws';
import { ARIA2_DOWNLOAD_DIR } from '../../constants';
import { createReadStream, stat } from 'fs-extra';
import { FileService } from '../file/file.service';
import { generateMD5 } from '../../utils/generate-md5.util';
import path from 'path';
import { FileSourceEnum } from '../../enums/file-source.enum';
import { File } from '../file/file.entity';
import FileType from 'file-type';

@Injectable()
export class Aria2Service implements OnModuleInit {
  private client: _AsyncVersionOf<Aria2>;
  private socket: WebSocket;

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
    this.client = createClient({
      url: `http://${this.options.rpcUrl}`,
      secret: this.options.rpcSecret,
    });
    const info = await this.client.getVersion();
    this.logger.log(`Aria2 service is running, version=${info.version}`);

    this.socket = new WebSocket(`ws://${this.options.rpcUrl}`);
    this.socket.onmessage = this.websocketNotificationHandler.bind(this);

    if (this.options.autoUpdateTracker) {
      const job = new CronJob({
        cronTime: CronExpression.EVERY_12_HOURS,
        onTick: async () => await this.updateBtTrackers(),
        runOnInit: true,
      });
      this.scheduleRegistry.addCronJob('auto-update-trackers', job);
    }
  }

  private async websocketNotificationHandler(event: MessageEvent) {
    const message: Aria2WsMessage = JSON.parse(event.data.toString());
    if (['aria2.onDownloadComplete', 'aria2.onDownloadError'].includes(message.method)) {
      const gid = message.params[0].gid;
      const status = await this.client.tellStatus(gid);
      const parentGid = typeof status.following === 'string' ? status.following : gid;
      const task = this.tasks.get(parentGid);

      if (task) {
        if (message.method === 'aria2.onDownloadComplete') {
          const files: File[] = [];
          let expireAt = new Date();
          if (this.options.expireHours > 0) {
            expireAt.setHours(expireAt.getHours() + this.options.expireHours);
          } else {
            expireAt = null;
          }

          for (const file of status.files) {
            const fileStat = await stat(file.path);
            const fileType = await FileType.fromFile(file.path);
            const filename = path.basename(file.path);
            const record = await this.fileService.save({
              size: fileStat.size,
              filename: filename,
              name: filename,
              md5: await generateMD5(createReadStream(file.path)),
              mimetype: fileType && fileType.mime,
              source: FileSourceEnum.ARIA2_DOWNLOAD,
              path: file.path,
              expireAt,
            });
            files.push(record);
          }

          if (status.following || !status.followedBy) {
            task.emit('complete', files);
            this.tasks.delete(parentGid);
          }
        } else {
          task.emit('error', status);
        }
      }
    }
  }

  async addTask(url: string) {
    const tracker = await this.cacheStore.get<string>(Aria2Service.TRACKER_CACHE_KEY);
    const gid = await this.client.addUri([url], {
      'bt-tracker': tracker ?? '',
      dir: ARIA2_DOWNLOAD_DIR,
    });
    const task = new Aria2DownloadTask(gid);
    this.tasks.set(gid, task);

    return task;
  }

  private async updateBtTrackers() {
    try {
      const response = await fetch(this.options.trackerListUrl);
      const rawText = await response.text();
      const tracker = rawText.replace(/\s+/g, ',');
      await this.cacheStore.set(Aria2Service.TRACKER_CACHE_KEY, tracker);
    } catch (error) {
      this.logger.error('Aria2 update trackers failed');
      if (error.stack) {
        this.logger.error(error.stack);
      }
    }
  }
}
