import { User } from '../user/user.entity';
import { Live } from './live.entity';

export interface ServerPushMediaStream {
  type: 'server-push';
  media: {
    title: string;
    url: string;
  };
  status: 'playing' | 'paused' | 'stopped';
  position: number;
  updateAt: Date;
}

export type LiveStream = ServerPushMediaStream;

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
