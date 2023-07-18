export interface MediaMetadata {
  streams: {
    index: number;
    codec_name: string;
    codec_type: string;
    tags?: {
      title?: string;
    };
  }[];
}
