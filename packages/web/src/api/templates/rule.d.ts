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

/**
 * Validate an RSS feed entry, Returns whether MinaPlay should download this entry
 * @param entry Original RSS feed entry
 */
declare type RuleEntryValidator = (entry: FeedEntry) => boolean | Promise<boolean>;

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
}

/**
 * Describe a downloaded media file
 * @param entry Original RSS feed entry
 * @param file Media file
 * @param files Media files in the same download task
 */
declare type RuleFileDescriber = (
  entry: FeedEntry,
  file: FileEntity,
  files: FileEntity[],
) => RuleFileDescriptor | Promise<RuleFileDescriptor>;

declare interface RuleHooks {
  validate: RuleEntryValidator;
  describe?: RuleFileDescriber;
}
