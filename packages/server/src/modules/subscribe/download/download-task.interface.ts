import { TypedEventEmitter } from '../../../utils/typed-event-emitter.js';
import { File } from '../../file/file.entity.js';
import { Torrent } from 'webtorrent';

export type DownloadTaskEventMap = {
  done: (files: File[]) => any;
  failed: (error: Error | string) => any;
  remove: () => any;
  pause: () => any;
  start: () => any;
};

export interface DownloadTask extends TypedEventEmitter<DownloadTaskEventMap> {
  id: string;
  torrent: Torrent;
  pause: () => Promise<void>;
  unpause: () => Promise<void>;
  remove: () => Promise<void>;
}
