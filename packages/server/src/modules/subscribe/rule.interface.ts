import { FeedEntry } from '@extractus/feed-extractor';
import { File } from '../file/file.entity';

export interface RuleEntryValidator {
  (entry: FeedEntry): boolean | Promise<boolean>;
}

export interface RuleMediaDescriptor {
  name?: string;
  description?: string;
  isPublic?: boolean;
}

export interface RuleEpisodeDescriptor {
  title?: string;
  no?: string;
}

export type RuleFileDescriptor = RuleMediaDescriptor & RuleEpisodeDescriptor;

export interface RuleFileDescriber {
  (entry: FeedEntry, file: File): RuleFileDescriptor | Promise<RuleFileDescriptor>;
}

export interface RuleHooks {
  validate: RuleEntryValidator;
  describe?: RuleFileDescriber;
}
