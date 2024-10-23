export interface LiveModuleOptions {
  mediasoupAnnouncedAddress: string;
  mediasoupRtcMinPort: number;
  mediasoupRtcMaxPort: number;
  mediasoupWorkerNum: number;
  mediasoupAudioClockRate?: number;
  mediasoupAudioChannel?: number;
  mediasoupMaxIncomeBitrate?: number;

  streamRtmpPort?: number;
  streamHttpPort?: number;
  streamChunkSize?: number;
  streamFfmpegPath: string;
  streamPublishKey: string;
}
