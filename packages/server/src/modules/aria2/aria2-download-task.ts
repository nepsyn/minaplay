import { TypedEventEmitter } from '../../utils/typed-event-emitter';
import { type TellStatusResult } from 'a2c';
import { File } from '../file/file.entity';

export type Aria2DownloadItemEventMap = {
  complete: (files: File[]) => any;
  error: (status: Partial<TellStatusResult>) => any;
};

export class Aria2DownloadTask extends TypedEventEmitter<Aria2DownloadItemEventMap> {
  constructor(public readonly gid: string) {
    super();
  }
}
