declare interface SourceEntity {
  id: number;
  url: string;
  remark?: string;
  title?: string;
  cron: string;
  enabled: boolean;
  createAt: Date;
  updateAt: Date;
}

declare interface RuleEntity {
  id: number;
  remark?: string;
  sources: SourceEntity[];
  code: string;
  createAt: Date;
  updateAt: Date;
}

declare interface FileEntity {
  id: string;
  name: string;
  size: number;
  md5: string;
  mimetype?: string;
  path: string;
  createAt: Date;
}

declare interface FeedEntry {
  id: string;
  link?: string;
  title?: string;
  description?: string;
  published?: Date;
}

declare interface RuleEntryValidatorContext {
  /** Source download item from */
  source: SourceEntity;
  /** Rule download item form */
  rule: RuleEntity;
  /** Meta info from rule code */
  meta: object;
}

/**
 * Validate an RSS feed entry, Returns whether MinaPlay should download this entry
 * @param entry Original RSS feed entry
 * @param ctx Validate item context
 */
declare type RuleEntryValidator = (entry: FeedEntry, ctx: RuleEntryValidatorContext) => boolean | Promise<boolean>;

declare interface RuleMediaDescriptor {
  /** Name of this media */
  name?: string;
  /** Description of this media */
  description?: string;
  /** Indicate that whether this media is public visible */
  isPublic?: boolean;
}

declare interface RuleSeriesDescriptor {
  /** Name of the series this media file belongs to */
  name: string;
  /** Season name of the series this media file belongs to */
  season?: string;
}

declare interface RuleEpisodeDescriptor {
  /** Title of this episode */
  title: string;
  /** Number of this episode */
  no?: string;
  /** Publish date of this episode */
  pubAt?: Date;
}

declare interface RuleFileDescriptor {
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

declare interface RuleFileDescriberContext {
  /** Source download item from */
  source?: SourceEntity;
  /** Rule download item form */
  rule?: RuleEntity;
  /** Original download entry */
  entry: FeedEntry;
  /** Media files in the same download task */
  files: FileEntity[];
  /** Meta info from rule code */
  meta: object;
}

/**
 * Describe a downloaded media file
 * @param entry Original RSS feed entry
 * @param file Media file
 * @param ctx Describe item context
 */
declare type RuleFileDescriber = (
  entry: FeedEntry,
  file: FileEntity,
  ctx: RuleFileDescriberContext,
) => RuleFileDescriptor | Promise<RuleFileDescriptor>;

declare type RuleHookDelegate = `${string}:${string}`;

declare interface RuleHooks {
  validate: RuleEntryValidator | RuleHookDelegate;
  describe?: RuleFileDescriber | RuleHookDelegate;
}
