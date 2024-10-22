import { DownloaderAdapter } from '../downloader-adapter.interface.js';
import { DownloadService } from '../download.service.js';
import { DownloadTask } from '../download-task.interface.js';
import WebTorrent, { Torrent } from 'webtorrent';
import { ApplicationLogger } from '../../../../common/application.logger.service.js';
import { TypedEventEmitter } from '../../../../utils/typed-event-emitter.js';
import { FileSourceEnum, StatusEnum } from '../../../../enums/index.js';
import fs from 'fs-extra';
import path from 'node:path';
import { File } from '../../../file/file.entity.js';
import { fileTypeFromFile } from 'file-type';
import { generateMD5 } from '../../../../utils/generate-md5.util.js';

export class WebtorrentAdapter implements DownloaderAdapter {
  private client: WebTorrent.Instance;
  private logger = new ApplicationLogger(WebtorrentAdapter.name);

  constructor(public service: DownloadService) {}

  async initialize() {
    this.client = new WebTorrent();
  }

  async createTask(id: string, url: string, dir: string, trackers: string[]) {
    const torrent = this.client.add(url, {
      path: dir,
      announce: trackers,
    });
    this.logger.debug(`Download task #${id} created`);

    const task: DownloadTask<Torrent> = Object.assign(new TypedEventEmitter(), {
      id,
      controller: torrent,
      pause: async () => {
        if (!torrent.paused) {
          torrent.pause();
          await this.service.save({ id, status: StatusEnum.PAUSED });
          this.logger.debug(`Download task #${id} paused`);
          task.emit('pause');
        }
      },
      unpause: async () => {
        if (torrent.paused) {
          torrent.resume();
          await this.service.save({ id: id, status: StatusEnum.PENDING });
          this.logger.debug(`Download task #${id} unpaused`);
          task.emit('start');
        }
      },
      remove: async () => {
        torrent.destroy();
        await this.service.save({ id, status: StatusEnum.FAILED, error: 'Canceled' });
        this.logger.debug(`Download task #${id} removed`);
        task.emit('remove');
        task.removeAllListeners();
        this.service.tasks.delete(id);
      },
    });

    // register torrent event listeners
    torrent.on('error', async (error) => {
      await this.service.save({ id: id, status: StatusEnum.FAILED, error: String(error) });
      this.logger.debug(`Download task #${id} error: ${String(error)}`);
      task.emit('failed', error);
      task.removeAllListeners();
      this.service.tasks.delete(id);
    });
    torrent.on('done', async () => {
      const localFiles = torrent.files.filter((file) => fs.existsSync(path.join(dir, file.path)));
      const files: File[] = [];
      for (const file of localFiles) {
        const filePath = path.join(dir, file.path);
        const fileStat = await fs.stat(filePath);
        const fileType = await fileTypeFromFile(filePath);
        const record = await this.service.getFileService().save({
          size: fileStat.size,
          filename: file.name,
          name: file.name,
          md5: await generateMD5(fs.createReadStream(filePath)),
          mimetype: fileType && fileType.mime,
          source: FileSourceEnum.DOWNLOAD,
          path: filePath,
        });
        files.push(record);
      }

      await this.service.save({ id: id, status: StatusEnum.SUCCESS });
      this.logger.debug(`Download task #${id} done, total files count: ${torrent.files.length}`);
      task.emit('done', files);
      task.removeAllListeners();
      this.service.tasks.delete(id);
    });

    return task;
  }

  async getState(task: DownloadTask<Torrent>) {
    return {
      totalLength: task.controller.length,
      completedLength: task.controller.downloaded,
      downloadSpeed: task.controller.downloadSpeed,
      progress: task.controller.progress,
    };
  }
}
