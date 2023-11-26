declare interface FileEntity {
  id: string;
  name: string;
  size: number;
  md5: string;
  mimetype?: string;
  source: 'USER_UPLOAD' | 'ARIA2_DOWNLOAD' | 'AUTO_GENERATED';
  path: string;
  expireAt?: Date;
  createAt: Date;
  updateAt: Date;
  isExist: boolean;
}

declare interface FeedEntry {
  id: string;
  link?: string;
  title?: string;
  description?: string;
  published?: Date;
}

declare interface RuleEntryValidator {
  (entry: FeedEntry): boolean | Promise<boolean>;
}

declare interface RuleMediaDescriptor {
  name?: string;
  description?: string;
  isPublic?: boolean;
}

declare interface RuleEpisodeDescriptor {
  series: string;
  season?: string;

  title?: string;
  no?: string;
  pubAt?: Date;
}

declare interface RuleFileDescriptor {
  media?: RuleMediaDescriptor;
  episode?: RuleEpisodeDescriptor;
}

declare interface RuleFileDescriber {
  (entry: FeedEntry, file: FileEntity): RuleFileDescriptor | Promise<RuleFileDescriptor>;
}

declare interface RuleHooks {
  validate: RuleEntryValidator;
  describe?: RuleFileDescriber;
}
