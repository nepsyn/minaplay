import { TypedEventEmitter } from '../../utils/typed-event-emitter';
import { File } from '../file/file.entity';

export type Aria2DownloadItemEventMap = {
  complete: (files: File[]) => any;
  error: (status) => any;
};

export class Aria2DownloadTask extends TypedEventEmitter<Aria2DownloadItemEventMap> {
  constructor(public readonly gid: string) {
    super();
  }
}
