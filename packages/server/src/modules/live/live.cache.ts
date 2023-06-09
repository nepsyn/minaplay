import { User } from '../user/user.entity';
import { Live } from './live.entity';

export interface ServerPushMediaStream {
  adapter: 'server-push';
  media: {
    title: string;
    url: string;
  };
  status: 'playing' | 'paused' | 'stopped';
  position: number;
  updateAt: Date;
}

export type LiveStream = ServerPushMediaStream;

export interface UserControl extends User {
  mute: {
    chat: boolean;
    voice: boolean;
  };
}

export interface LiveCache {
  live: Live;
  users: UserControl[];
  streams: LiveStream[];
  updateAt: Date;
}
