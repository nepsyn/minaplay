// @ts-ignore
import { type FeedEntry } from '@extractus/feed-extractor';

declare module '@extractus/feed-extractor' {
  export interface FeedEntry {
    enclosure: {
      url: string;
      type?: string;
    };
  }
}
