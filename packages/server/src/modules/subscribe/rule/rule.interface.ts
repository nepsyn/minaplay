import { FeedEntry } from '@extractus/feed-extractor';
import { File } from '../../file/file.entity.js';

export interface RuleEntryValidator {
  (entry: FeedEntry): boolean | Promise<boolean>;
}

export interface RuleMediaDescriptor {
  name?: string;
  description?: string;
  isPublic?: boolean;
}

export interface RuleEpisodeDescriptor {
  series: string;
  season?: string;

  title?: string;
  no?: string;
  pubAt?: Date;
}

export interface RuleFileDescriptor {
  media?: RuleMediaDescriptor;
  episode?: RuleEpisodeDescriptor;
}

export interface RuleFileDescriber {
  (entry: FeedEntry, file: File): RuleFileDescriptor | Promise<RuleFileDescriptor>;
}

export interface RuleHooks {
  validate: RuleEntryValidator;
  describe?: RuleFileDescriber;
}
