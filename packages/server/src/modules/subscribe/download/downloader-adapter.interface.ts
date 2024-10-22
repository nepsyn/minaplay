import { type DownloadService } from './download.service.js';
import { DownloadTask } from './download-task.interface.js';
import { DownloadItemState } from './download-item-state.interface.js';

export interface DownloaderAdapter {
  service: DownloadService;

  initialize?(): Promise<void>;

  createTask(id: string, url: string, dir: string, trackers: string[]): Promise<DownloadTask>;

  getState(task: DownloadTask): Promise<DownloadItemState>;
}
