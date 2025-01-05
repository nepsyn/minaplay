import { FeedEntry } from '@extractus/feed-extractor';
import { File } from '../../file/file.entity.js';
import { Context, Module } from 'isolated-vm';
import { Source } from '../source/source.entity.js';
import { Rule } from './rule.entity.js';

export interface RuleEntryValidatorContext {
  /** Source download item from */
  source: Source;
  /** Rule download item form */
  rule: Rule;
  /** Meta info from rule code */
  meta: object;
}

export interface RuleEntryValidator {
  /**
   * Validate an RSS feed entry, Returns whether MinaPlay should download this entry
   * @param entry Original RSS feed entry
   * @param ctx Validate item context
   */
  (entry: FeedEntry, ctx: RuleEntryValidatorContext): boolean | Promise<boolean>;
}

export interface RuleMediaDescriptor {
  /** Name of this media */
  name?: string;
  /** Description of this media */
  description?: string;
  /** Indicate that whether this media is public visible */
  isPublic?: boolean;
}

export interface RuleSeriesDescriptor {
  /** Name of the series this media file belongs to */
  name: string;
  /** Season name of the series this media file belongs to */
  season?: string;
}

export interface RuleEpisodeDescriptor {
  /** Title of this episode */
  title: string;
  /** Number of this episode */
  no?: string;
  /** Publish date of this episode */
  pubAt?: Date;
}

export interface RuleFileDescriptor {
  /** Media descriptor */
  media?: RuleMediaDescriptor;
  /** Series descriptor */
  series?: RuleSeriesDescriptor;
  /** Episode descriptor */
  episode?: RuleEpisodeDescriptor;

  /** Indicates whether to overwrite the original episode when episode of the same 'title' & 'no' exists in MinaPlay */
  overwriteEpisode?: boolean;
  /** Save path of media file ( from `data/index` dir ) */
  savePath?: string;
}

export interface RuleFileDescriberContext {
  /** Source download item from */
  source?: Source;
  /** Rule download item form */
  rule?: Rule;
  /** Original download entry */
  entry: FeedEntry;
  /** Media files in the same download task */
  files: File[];
  /** Meta info from rule code */
  meta: object;
}

export interface RuleFileDescriber {
  /**
   * Describe a downloaded media file
   * @param entry Original RSS feed entry
   * @param file Media file
   * @param ctx Describe item context
   */
  (entry: FeedEntry, file: File, ctx: RuleFileDescriberContext): RuleFileDescriptor | Promise<RuleFileDescriptor>;
}

type RuleHookDelegate = `${string}:${string}`;

export interface RuleHooks {
  validate: RuleEntryValidator | RuleHookDelegate;
  describe?: RuleFileDescriber | RuleHookDelegate;
}

type CallableRuleHooks = { [P in keyof RuleHooks]: Exclude<RuleHooks[P], RuleHookDelegate> };

export interface RuleVm {
  context: Context;
  module: Module;
  hooks: Partial<CallableRuleHooks>;
  meta: object;
  release: () => void;
}
