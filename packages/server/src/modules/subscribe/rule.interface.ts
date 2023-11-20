import { FeedEntry } from '@extractus/feed-extractor';
import { File } from '../file/file.entity';
import { Source } from './source.entity';

export interface RuleEntryValidator {
  (entry: FeedEntry, source: Omit<Source, 'user' | 'downloads' | 'logs'>): boolean | Promise<boolean>;
}

export interface RuleMediaDescriptor {
  name?: string;
  description?: string;
  isPublic?: boolean;
}

export interface RuleEpisodeDescriptor {
  title?: string;
  no?: string;
  pubAt?: Date;
}

export type RuleFileDescriptor = RuleMediaDescriptor & RuleEpisodeDescriptor;

export interface RuleFileDescriber {
  (entry: FeedEntry, file: File): RuleFileDescriptor | Promise<RuleFileDescriptor>;
}

export interface RuleHooks {
  validate: RuleEntryValidator;
  describe?: RuleFileDescriber;
}
