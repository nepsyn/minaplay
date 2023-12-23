import { UserEntity } from '@/api/interfaces/user.interface';
import { FileEntity } from '@/api/interfaces/file.interface';
import { ApiQueryDto } from '@/api/interfaces/common.interface';
import { MediaKind, RtpCapabilities, RtpParameters } from 'mediasoup-client/lib/RtpParameters';
import { DtlsParameters, TransportOptions } from 'mediasoup-client/lib/Transport';

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
    user?: UserEntity;
    action:
      | 'connect'
      | 'disconnect'
      | 'member-join'
      | 'member-quit'
      | 'member-mute-chat'
      | 'member-unmute-chat'
      | 'member-mute-voice'
      | 'member-unmute-voice';
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

  'voice-rtp-capabilities': [undefined, RtpCapabilities];
  'voice-get-producers': [undefined, { userId: number; producerId: string }[]];
  'voice-create-webrtc-transport': [undefined, TransportOptions];
  'voice-connect-webrtc-transport': [{ transportId: string; dtlsParameters: DtlsParameters }, undefined];
  'voice-create-producer': [{ transportId: string; dtlsParameters: DtlsParameters }, { producerId: string }];
  'voice-create-consumer': [
    { transportId: string; producerId: string; rtpCapabilities: RtpCapabilities },
    {
      consumerId: string;
      producerId: string;
      kind: MediaKind;
      rtpParameters: RtpParameters;
      type: 'simple' | 'simulcast' | 'svc' | 'pipe';
      producerPaused: boolean;
    },
  ];
};

export interface RoomVoice {
  user: UserEntity;
  el: HTMLAudioElement;
  volume: number;
}
