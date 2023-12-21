import { UserEntity } from '@/api/interfaces/user.interface';
import { FileEntity } from '@/api/interfaces/file.interface';
import { ApiQueryDto } from '@/api/interfaces/common.interface';

export interface LiveEntity {
  id: string;
  title?: string;
  hasPassword: boolean;
  poster?: FileEntity;
  user?: UserEntity;
  createAt: Date;
  updateAt: Date;
}

export interface LiveDto {
  title?: string;
  password?: string;
  posterFileId?: string;
}

export interface LiveQueryDto extends ApiQueryDto<LiveEntity> {
  keyword?: string;
  userId?: number;
}

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
  live: LiveEntity;
  users: UserEntity[];
  muted: {
    chat: number[];
    voice: number[];
  };
  stream?: LiveStream;
  updateAt: Date;
}

export interface LiveChatText {
  type: 'Text';
  content: string;
}

export interface LiveChatNetworkImage {
  type: 'NetworkImage';
  url: string;
}

export interface LiveChatEntity {
  id: string;
  user: UserEntity;
  message: LiveChatText | LiveChatNetworkImage;
  createAt: Date;
}

export interface LiveNotify {
  type: 'Notify';
  data: {
    operator?: UserEntity;
    target?: UserEntity;
    action: 'connect' | 'disconnect' | 'member-join' | 'member-quit';
    type?: 'info' | 'warning' | 'success' | 'error';
  };
}

export interface LiveChat {
  type: 'Chat';
  data: LiveChatEntity;
}

export type LiveEvent = LiveNotify | LiveChat;

export type LiveEventMap = {
  info: [{ id: string }, LiveEntity];
  join: [{ id: string; password?: string }, LiveState];
  chat: [{ message: LiveChatText | LiveChatNetworkImage }, undefined];
  messages: [{ start: string; end?: string }, LiveChatEntity[]];
};
