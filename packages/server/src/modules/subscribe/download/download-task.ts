import { TypedEventEmitter } from '../../../utils/typed-event-emitter.js';
import { File } from '../../file/file.entity.js';
import { aria2, Aria2DownloadStatus, Conn as Aria2Connection } from 'maria2';

export type DownloadTaskEventMap = {
  complete: (files: File[], status: Aria2DownloadStatus) => any;
  error: (status: Aria2DownloadStatus) => any;
  pause: (status: Aria2DownloadStatus) => any;
  start: (status: Aria2DownloadStatus) => any;
  stop: (status: Aria2DownloadStatus) => any;
};

export class DownloadTask extends TypedEventEmitter<DownloadTaskEventMap> {
  constructor(public readonly taskId: string, public readonly itemId: string, private conn: Aria2Connection) {
    super();
  }

  private async getFollowedGid() {
    const status = await aria2.tellStatus(this.conn, this.taskId);
    return status.followedBy?.[0];
  }

  async pause(): Promise<Aria2DownloadStatus> {
    return new Promise(async (resolve) => {
      this.once('pause', (status) => resolve(status));
      await aria2.forcePause(this.conn, (await this.getFollowedGid()) ?? this.taskId);
    });
  }

  async unpause(): Promise<Aria2DownloadStatus> {
    return new Promise(async (resolve) => {
      this.once('start', (status) => resolve(status));
      await aria2.unpause(this.conn, (await this.getFollowedGid()) ?? this.taskId);
    });
  }

  async remove() {
    return new Promise(async (resolve) => {
      this.once('stop', (status) => resolve(status));
      await aria2.forceRemove(this.conn, (await this.getFollowedGid()) ?? this.taskId);
    });
  }
}
