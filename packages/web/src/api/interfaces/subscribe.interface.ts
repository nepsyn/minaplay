import { UserEntity } from './user.interface';
import { SeriesEntity } from './series.interface';
import { ApiQueryDto } from '@/api/interfaces/common.interface';

export interface SourceEntity {
  /** id */
  id: number;
  /** url */
  url: string;
  /** 备注 */
  remark?: string;
  /** 标题 */
  title?: string;
  /** 更新周期 cron 表达式 */
  cron: string;
  /** 是否启用 */
  enabled: boolean;
  /** 创建用户 */
  user: UserEntity;
  /** 创建时间 */
  createAt: Date;
  /** 更新时间 */
  updateAt: Date;
}

export interface SourceDto {
  url?: string;
  title?: string;
  remark?: string;
  cron?: string;
  enabled?: boolean;
}

export interface SourceQueryDto extends ApiQueryDto<SourceEntity> {
  keyword?: string;
  id?: number;
  url?: string;
  userId?: number;
}

export interface RuleEntity {
  /** id */
  id: number;
  /** 备注 */
  remark?: string;
  /** 代码 */
  code?: string;
  /** 订阅源 */
  source: SourceEntity;
  /** 剧集 */
  series: SeriesEntity;
  /** 创建时间 */
  createAt: Date;
  /** 更新时间 */
  updateAt: Date;
}

export interface RuleDto {
  code?: string;
  remark?: string;
  sourceId?: number;
  seriesId?: number;
}

export interface RuleQueryDto extends ApiQueryDto<RuleEntity> {
  keyword?: string;
  id?: number;
  sourceId?: number;
  seriesId?: number;
}

export interface FetchLogEntity {
  id: string;
  source: SourceEntity;
  success: boolean;
  data?: string;
  error?: string;
  createAt: Date;
}

export interface FetchLogQueryDto extends ApiQueryDto<FetchLogEntity> {
  start?: Date;
  end?: Date;
}

export interface DownloadItemEntity {
  id: string;
  title: string;
  url: string;
  source: SourceEntity;
  rule: RuleEntity;
  status: 'DOWNLOADED' | 'DOWNLOADING' | 'FAILED';
  error?: string;
  createAt: Date;
}

export interface DownloadItemQueryDto extends ApiQueryDto<DownloadItemEntity> {
  keyword?: string;
  start?: Date;
  end?: Date;
  status?: 'DOWNLOADED' | 'DOWNLOADING' | 'FAILED';
}

export interface FeedEntry {
  id: string;
  link?: string;
  title?: string;
  description?: string;
  published?: Date;
  enclosure: {
    url: string;
    type?: string;
  };
}

export interface FeedData {
  link?: string;
  title?: string;
  description?: string;
  generator?: string;
  language?: string;
  published?: Date;
  entries?: Array<FeedEntry>;
}
