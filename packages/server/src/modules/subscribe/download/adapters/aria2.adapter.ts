import { DownloaderAdapter } from '../downloader-adapter.interface.js';
import { DownloadService } from '../download.service.js';
import { ApplicationLogger } from '../../../../common/application.logger.service.js';
import { aria2, Aria2ClientNotification, Conn as Aria2Connection, open } from 'maria2';
import fs from 'fs-extra';
import { fileTypeFromFile } from 'file-type';
import { File } from '../../../file/file.entity.js';
import path from 'node:path';
import { generateMD5 } from '../../../../utils/generate-md5.util.js';
import { FileSourceEnum, StatusEnum } from '../../../../enums/index.js';
import { DownloadTask } from '../download-task.interface.js';
import { TypedEventEmitter } from '../../../../utils/typed-event-emitter.js';
import { randomUUID } from 'node:crypto';
import WebSocket from 'ws';

export interface Aria2TaskController {
  gid: string;
}

export class Aria2Adapter implements DownloaderAdapter {
  private conn: Aria2Connection;
  private logger = new ApplicationLogger(Aria2Adapter.name);

  constructor(public service: DownloadService) {}

  async initialize() {
    try {
      const options = this.service.getOptions();
      this.conn = await open(
        new WebSocket(`ws://${options.aria2RpcHost}:${options.aria2RpcPort}${options.aria2RpcPath}`),
        {
          secret: options.aria2RpcSecret,
        },
      );
      this.conn.getSocket().addEventListener('close', () => {
        this.logger.error('Aria2 WS connection closed, reconnect in 5 seconds');
        setTimeout(() => this.initialize(), 5000);
      });

      aria2.onBtDownloadComplete(this.conn, this.onDownloadComplete.bind(this));
      aria2.onDownloadComplete(this.conn, this.onDownloadComplete.bind(this));
      aria2.onDownloadError(this.conn, this.onDownloadError.bind(this));
      aria2.onDownloadPause(this.conn, this.onDownloadPause.bind(this));
      aria2.onDownloadStart(this.conn, this.onDownloadStart.bind(this));
      aria2.onDownloadStop(this.conn, this.onDownloadStop.bind(this));

      const { version } = await aria2.getVersion(this.conn);
      this.logger.log(`Aria2 version=${version}`);
    } catch (error) {
      this.logger.error(
        'Aria2 WS connect failed, reconnect in 5 seconds',
        error.stack ?? error.message,
        Aria2Adapter.name,
      );
      setTimeout(() => this.initialize(), 5000);
    }
  }

  private findTaskByGid(gid: string): DownloadTask<Aria2TaskController> {
    return [...this.service.tasks.values()].find(
      (task: DownloadTask<Aria2TaskController>) => task.controller.gid === gid,
    );
  }

  private async onDownloadComplete({ gid }: Aria2ClientNotification) {
    const status = await aria2.tellStatus(this.conn, gid);
    const task = this.findTaskByGid(status.following ?? gid);
    const localFiles = status.files.filter(({ path }) => fs.existsSync(path));
    if (task) {
      const files: File[] = [];
      for (const file of localFiles) {
        const fileStat = await fs.stat(file.path);
        const fileType = await fileTypeFromFile(file.path);
        const filename = path.basename(file.path);
        const record = await this.service.getFileService().save({
          size: fileStat.size,
          filename: filename,
          name: filename,
          md5: await generateMD5(fs.createReadStream(file.path)),
          mimetype: fileType && fileType.mime,
          source: FileSourceEnum.DOWNLOAD,
          path: file.path,
        });
        files.push(record);
      }

      if (status.following || !status.followedBy) {
        await this.service.save({ id: task.id, status: StatusEnum.SUCCESS });
        this.logger.debug(`Download task #${task.id} done, total files count: ${files.length}`);
        task.emit('done', files);
        task.removeAllListeners();
        this.service.tasks.delete(task.id);
      }
    }
  }

  private async onDownloadError({ gid }: Aria2ClientNotification) {
    const status = await aria2.tellStatus(this.conn, gid);
    const task = this.findTaskByGid(status.following ?? gid);
    if (task) {
      await this.service.save({ id: task.id, status: StatusEnum.FAILED, error: status.errorMessage });
      this.logger.debug(`Download task #${task.id} error: ${String(status.errorMessage)}`);
      task.emit('failed', status.errorMessage);
      task.removeAllListeners();
      this.service.tasks.delete(task.id);
    }
  }

  private async onDownloadPause({ gid }: Aria2ClientNotification) {
    const status = await aria2.tellStatus(this.conn, gid);
    const task = this.findTaskByGid(status.following ?? gid);
    if (task) {
      await this.service.save({ id: task.id, status: StatusEnum.PAUSED });
      this.logger.debug(`Download task #${task.id} paused`);
      task.emit('pause');
    }
  }

  private async onDownloadStart({ gid }: Aria2ClientNotification) {
    const status = await aria2.tellStatus(this.conn, gid);
    const task = this.findTaskByGid(status.following ?? gid);
    if (task) {
      await this.service.save({ id: task.id, status: StatusEnum.PENDING });
      task.emit('start');
    }
  }

  private async onDownloadStop({ gid }: Aria2ClientNotification) {
    const status = await aria2.tellStatus(this.conn, gid);
    const task = this.findTaskByGid(status.following ?? gid);
    if (task) {
      await this.service.save({ id: task.id, status: StatusEnum.FAILED, error: 'Canceled' });
      this.logger.debug(`Download task #${task.id} stopped`);
      task.emit('remove');
      task.removeAllListeners();
      this.service.tasks.delete(task.id);
    }
  }

  async createTask(id: string, url: string, dir: string, trackers: string[]) {
    const options = this.service.getOptions();
    const gid = randomUUID().replace(/-/g, '').slice(0, 16);
    const task: DownloadTask<Aria2TaskController> = Object.assign(new TypedEventEmitter(), {
      id,
      controller: { gid },
      pause: async () => {
        return new Promise<void>(async (resolve) => {
          const status = await aria2.tellStatus(this.conn, gid);
          task.once('pause', () => resolve());
          await aria2.forcePause(this.conn, status.followedBy?.[0] ?? gid);
        });
      },
      unpause: async () => {
        return new Promise<void>(async (resolve) => {
          const status = await aria2.tellStatus(this.conn, gid);
          task.once('start', () => resolve());
          await aria2.unpause(this.conn, status.followedBy?.[0] ?? gid);
        });
      },
      remove: async () => {
        return new Promise<void>(async () => {
          await this.service.save({ id: task.id, status: StatusEnum.FAILED, error: 'Canceled' });
          this.logger.debug(`Download task #${task.id} removed`);
          task.emit('remove');
          task.removeAllListeners();
          this.service.tasks.delete(task.id);
          const status = await aria2.tellStatus(this.conn, gid);
          await aria2.forceRemove(this.conn, status.followedBy?.[0] ?? gid);
        });
      },
    });

    await aria2.addUri(this.conn, [url], {
      'http-proxy': options.httpProxy,
      'seed-time': '0',
      'bt-tracker': trackers.join(',') ?? '',
      gid: gid,
      dir,
    });
    this.logger.debug(`Download task #${id} created`);

    return task;
  }

  async getState(task: DownloadTask<Aria2TaskController>) {
    let status = await aria2.tellStatus(this.conn, task.controller.gid);
    if (status.followedBy && status.followedBy.length > 0) {
      status = await aria2.tellStatus(this.conn, status.followedBy[0]);
    }

    return {
      totalLength: Number(BigInt(status.totalLength)),
      completedLength: Number(BigInt(status.completedLength)),
      downloadSpeed: Number(BigInt(status.downloadSpeed)),
      progress: Number(BigInt(status.totalLength)) / Number(BigInt(status.completedLength)),
    };
  }
}
