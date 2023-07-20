export interface LiveModuleOptions {
  mediasoupWorkerNum?: number;
  mediasoupAudioClockRate?: number;
  mediasoupAudioChannel?: number;
  mediasoupMaxIncomeBitrate?: number;

  streamRtmpPort?: number;
  streamChunkSize?: number;
  streamFfmpegPath: string;
  streamPublishKey: string;

  appHost: string;
}
