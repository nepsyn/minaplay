import { UserEntity } from './user.interface';
import { ApiQueryDto } from './common.interface';
import { StatusEnum } from '@/api/enums/status.enum';

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
  user?: UserEntity;
}

export interface SourceQueryDto extends ApiQueryDto<SourceEntity> {
  keyword?: string;
  enabled?: number;
  userId?: number;
}

export interface RuleEntity {
  id: number;
  remark?: string;
  sources: SourceEntity[];
  code: string;
  createAt: Date;
  updateAt: Date;
}

export interface RuleDto {
  code?: string;
  remark?: string;
  sourceIds?: number[];
}

export interface RuleQueryDto extends ApiQueryDto<RuleEntity> {
  keyword?: string;
  sourceId?: number;
}

export interface RuleErrorLogEntity {
  id: number;
  error: string;
  createAt: Date;
}

export interface ParseLogEntity {
  /** id */
  id: string;
  /** 订阅源 */
  source: SourceEntity;
  /** 是否成功 */
  status: StatusEnum;
  /** 错误内容 */
  error?: string;
  /** 创建日期 */
  createAt: Date;
}

export interface ParseLogQueryDto extends ApiQueryDto<ParseLogEntity> {
  status?: StatusEnum;
  start?: Date;
  end?: Date;
}

export interface DownloadItemEntity {
  /** id */
  id: string;
  /** 项目标题 */
  name: string;
  /** 下载链接 */
  url: string;
  /** 下载链接哈希 */
  hash: string;
  /** 所属订阅源 */
  source: SourceEntity;
  /** 命中规则 */
  rule: RuleEntity;
  /** 解析记录 */
  log?: ParseLogEntity;
  /** 下载状态 */
  status: StatusEnum;
  /** 错误内容 */
  error?: string;
  /** 创建时间 */
  createAt: Date;
  /** 下载中状态 */
  state: {
    totalLength: string;
    completedLength: string;
    downloadSpeed: string;
  };
}

export interface DownloadItemDto {
  name?: string;
  url: string;
  sourceId?: number;
}

export interface DownloadItemQueryDto extends ApiQueryDto<DownloadItemEntity> {
  keyword?: string;
  sourceId?: number;
  ruleId?: number;
  logId?: string;
  start?: Date;
  end?: Date;
  status?: StatusEnum;
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
