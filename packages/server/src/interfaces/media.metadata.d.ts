export interface MediaMetadata {
  streams: {
    index: number;
    codec_name: string;
    codec_type: string;
    duration?: string;
    tags?: {
      DURATION?: string;
      title?: string;
      filename?: string;
      mimetype?: string;
    };
  }[];
}
