import { TypedEventEmitter } from '../../../utils/typed-event-emitter.js';
import { File } from '../../file/file.entity.js';

export type DownloadTaskEventMap = {
  done: (files: File[]) => any;
  failed: (error: Error | string) => any;
  remove: () => any;
  pause: () => any;
  start: () => any;
};

export interface DownloadTask<T = any> extends TypedEventEmitter<DownloadTaskEventMap> {
  id: string;
  controller: T;
  pause: () => Promise<void>;
  unpause: () => Promise<void>;
  remove: () => Promise<void>;
}
