import { UserEntity } from './user.interface';
import { SeriesEntity } from './series.interface';

export interface SubscribeSourceEntity {
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
  /** 订阅规则 */
  rules: SubscribeRuleEntity[];
  /** 创建用户 */
  user: UserEntity;
  /** 创建时间 */
  createAt: Date;
  /** 更新时间 */
  updateAt: Date;
}

export interface SubscribeSourceDto {
  url?: string;
  title?: string;
  remark?: string;
  cron?: string;
  enabled?: boolean;
}

export interface SubscribeRuleEntity {
  /** id */
  id: number;
  /** 备注 */
  remark?: string;
  /** 订阅源 */
  source: SubscribeSourceEntity;
  /** 剧集 */
  series: SeriesEntity;
  /** 创建时间 */
  createAt: Date;
  /** 更新时间 */
  updateAt: Date;
}

export interface SubscribeRuleDto {
  code?: string;
  remark?: string;
  seriesId?: number;
}
