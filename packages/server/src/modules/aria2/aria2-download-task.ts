import { TypedEventEmitter } from '../../utils/typed-event-emitter';
import { File } from '../file/file.entity';
import { Aria2WsClient } from './aria2.ws-client';

export type Aria2DownloadItemEventMap = {
  complete: (files: File[]) => any;
  error: (status: Awaited<ReturnType<Aria2WsClient['tellStatus']>>) => any;
};

export class Aria2DownloadTask extends TypedEventEmitter<Aria2DownloadItemEventMap> {
  constructor(public readonly gid: string, public readonly url: string) {
    super();
  }
}
