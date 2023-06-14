import { User } from '../user/user.entity';
import { Live } from './live.entity';

export interface ServerPushMediaStream {
  type: 'server-push';
  media: {
    title: string;
    url: string;
  };
  updateAt: Date;
}

export interface ClientSyncMediaStream {
  type: 'client-sync';
  media: {
    title: string;
    url: string;
  };
  status: 'playing' | 'paused';
  position: number;
  updateAt: Date;
}

export type LiveStream = ServerPushMediaStream | ClientSyncMediaStream;

export interface LiveState {
  live: Live;
  users: User[];
  muted: {
    chat: number[];
    voice: number[];
  };
  stream: LiveStream;
  updateAt: Date;
}
