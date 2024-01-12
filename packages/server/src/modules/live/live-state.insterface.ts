import { User } from '../user/user.entity.js';
import { Live } from './live.entity.js';

export interface ServerPushMediaStream {
  type: 'server-push';
  title?: string;
  url: string;
  updateAt: Date;
}

export interface ClientSyncMediaStream {
  type: 'client-sync';
  title?: string;
  url: string;
  status: 'playing' | 'paused';
  position: number;
  updateAt: Date;
}

export interface ThirdPartyLiveStream {
  type: 'live-stream';
  title?: string;
  url: string;
  updateAt: Date;
}

export type LiveStream = ServerPushMediaStream | ClientSyncMediaStream | ThirdPartyLiveStream;

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
