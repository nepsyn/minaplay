import { InjectionToken, ModuleMetadata, ValueProvider } from '@nestjs/common';
import { Argument, Command, Option } from 'commander';
import { Observable } from 'rxjs';
import { MinaPlayMessage } from '../../common/application.message.js';
import { PluginListenerContext } from './plugin-listener-context.js';
import { ApiPaginationResultDto } from '../../common/api.pagination.result.dto.js';
import { FeedEntry } from '@extractus/feed-extractor';
import { File } from '../file/file.entity.js';
import {
  RuleEntryValidatorContext,
  RuleFileDescriberContext,
  RuleFileDescriptor,
} from '../subscribe/rule/rule.interface.js';

export interface MinaPlayPluginMetadata extends Pick<ModuleMetadata, 'imports' | 'providers'> {
  /** Plugin unique ID */
  id: string;
  /** Plugin icon url */
  icon?: string;
  /** Plugin version */
  version?: string;
  /** Plugin min support of MinaPlay version */
  supportVersion?: string;
  /** Plugin description */
  description?: string;
  /** Plugin author */
  author?: string;
  /** Plugin Git repository */
  repo?: string;
  /** Plugin license */
  license?: string;
}

export interface MinaPlayPluginHooks {
  onPluginInit?(): any;

  onPluginEnabled?(): any;

  onPluginDisabled?(): any;

  onPluginUninstall?(): any;
}

export type MinaPlayListenerResult = string | MinaPlayMessage | MinaPlayMessage[] | undefined;

export interface MinaPlayCallHandlerOptions {
  provides: ValueProvider[];
}

export interface MinaPlayCallHandler {
  handle(options?: MinaPlayCallHandlerOptions): Observable<MinaPlayListenerResult>;
  end(message?: MinaPlayListenerResult): Observable<MinaPlayListenerResult>;
}

export interface MinaPlayMessageListenerInterceptor {
  (ctx: PluginListenerContext, message: MinaPlayMessage, next: MinaPlayCallHandler):
    | Observable<MinaPlayListenerResult>
    | Promise<Observable<MinaPlayListenerResult>>;
}

export interface MinaPlayParamMetadata {
  index: number;
  param: InjectionToken;
}

export interface MinaPlayMessageListenerMetadata {
  interceptors: MinaPlayMessageListenerInterceptor[];
  type: Function;
  key: string | symbol;
  params: MinaPlayParamMetadata[];
}

export interface MinaPlayMessageListenerOptions {
  interceptors?: MinaPlayMessageListenerInterceptor[];
}

export interface MinaPlayCommanderArgMetadata {
  index: number;
  instance: Option | Argument;
}

export interface MinaPlayCommandOptions extends MinaPlayMessageListenerOptions {
  aliases?: string[];
  description?: string;
  parent?: () => Function;
  factory?: (program: Command) => Command;
}

export interface MinaPlayCommandMetadata {
  bin: string;
  aliases?: string[];
  parent?: () => Function;
  handler: Function;
  commandFactory: () => Command;
  subcommands: MinaPlayCommandMetadata[];
}

export interface MinaPlayCommandOptionOptions {
  description?: string;
  default?: any;
  factory?: (option: Option) => Option;
}

export interface MinaPlayCommandArgumentOptions {
  description?: string;
  required?: boolean;
  default?: any;
  factory?: (option: Argument) => Argument;
}

export interface MinaPlayParserMetadata {
  name: string;
  features: Record<keyof PluginSourceParser, boolean>;
}

export interface MinaPlayPluginSource {
  name: string;
  url: string;
  site?: string;
}

export interface MinaPlayPluginSourceEpisode {
  title?: string;
  no: string;
  pubAt?: Date;
  posterUrl?: string;
  downloadUrl?: string;
  playUrl?: string;
}

export interface MinaPlayPluginSourceSeries {
  id: string | number;
  name: string;
  season?: string;
  posterUrl?: string;
  pubAt?: Date;
  updateTime?: string;
  finished?: boolean;
  count?: number;
  description?: string;
  tags?: string[];
}

export interface MinaPlayPluginSourceCalendarDay {
  /** week day(Sunday=0) */
  weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  items: MinaPlayPluginSourceSeries[];
}

export type MaybePromise<T> = T | Promise<T>;

export interface PluginSourceParser {
  /**
   * Get update calendar
   */
  getCalendar?(): MaybePromise<MinaPlayPluginSourceCalendarDay[]>;

  /**
   * Get series by ID
   * @param id series ID
   */
  getSeriesById?(id: string): MaybePromise<MinaPlayPluginSourceSeries>;

  /**
   * Search series by keyword
   * @param keyword search keyword
   * @param page result page
   * @param size result page size
   */
  searchSeries?(
    keyword: string,
    page?: number,
    size?: number,
  ): MaybePromise<ApiPaginationResultDto<MinaPlayPluginSourceSeries>>;

  /**
   * Build subscribeSource for series
   * @param series series
   */
  buildSourceOfSeries?(series: MinaPlayPluginSourceSeries): MaybePromise<MinaPlayPluginSource>;

  /**
   * Build rule code for series
   * @param series series
   */
  buildRuleCodeOfSeries?(series: MinaPlayPluginSourceSeries): MaybePromise<string>;

  /**
   * Get episodes of series by series ID
   * @param id series ID
   * @param page result page
   * @param size result page size
   */
  getEpisodesBySeriesId?(
    id: string | number,
    page?: number,
    size?: number,
  ): MaybePromise<ApiPaginationResultDto<MinaPlayPluginSourceEpisode>>;

  /**
   * Validate feed entry to download
   * @param entry feed entry
   * @param ctx validate item context
   */
  validateFeedEntry?(entry: FeedEntry, ctx: RuleEntryValidatorContext): MaybePromise<boolean>;

  /**
   * Describe a download item
   * @param entry feed entry
   * @param file current file entity
   * @param ctx describe item context
   */
  describeDownloadItem?(entry: FeedEntry, file: File, ctx: RuleFileDescriberContext): MaybePromise<RuleFileDescriptor>;
}
