import { MinaPlayMessage } from '@/api/interfaces/message.interface';
import { SeriesEntity } from '@/api/interfaces/series.interface';
import { RuleEntity, SourceEntity } from '@/api/interfaces/subscribe.interface';

export interface PluginControl {
  id: string;
  icon?: string;
  version?: string;
  supportVersion?: string;
  description?: string;
  author?: string;
  repo?: string;
  license?: string;
  enabled: boolean;
  isBuiltin: boolean;
  programs: string[];
  parsers: MinaPlayParserMetadata[];
}

export interface PluginCommandDescriptor {
  program: string;
  control: PluginControl;
  description: string;
}

export interface MinaPlayPluginMessage {
  from: 'user' | 'plugin';
  control?: PluginControl;
  messages: MinaPlayMessage[];
}

export type PluginEventMap = {
  console: (arg: { message: MinaPlayMessage; locale?: string }) => MinaPlayMessage[] | undefined;
  commands: () => PluginCommandDescriptor[];
};

export interface MinaPlayParserMetadata {
  name: string;
  features: {
    getCalendar: boolean;
    getSeriesById: boolean;
    searchSeries: boolean;
    buildSourceOfSeries: boolean;
    buildRuleCodeOfSeries: boolean;
    getEpisodesBySeriesId: boolean;
  };
}

export interface MinaPlayPluginSourceEpisode {
  title?: string;
  no: string;
  pubAt?: string;
  posterUrl?: string;
  downloadUrl?: string;
  playUrl?: string;
}

export interface MinaPlayPluginSourceSeries {
  id: string | number;
  name: string;
  season?: string;
  posterUrl?: string;
  pubAt?: string;
  finished?: boolean;
  count?: number;
  description?: string;
  tags?: string[];
}

export interface MinaPlayPluginSourceSeriesSubscribeResult {
  series: SeriesEntity;
  source: SourceEntity;
  rule: RuleEntity;
}

export type MinaPlayPluginSourceSeriesSubscribe = Partial<MinaPlayPluginSourceSeriesSubscribeResult>;

export interface MinaPlayPluginSourceCalendarDay {
  /** week day(Sunday=0) */
  weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  items: MinaPlayPluginSourceSeries[];
}
