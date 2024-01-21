import { UserEntity } from './user.interface';
import { FileEntity } from '@/api/interfaces/file.interface';
import { MediaEntity } from '@/api/interfaces/media.interface';
import { ApiQueryDto } from '@/api/interfaces/common.interface';

export interface SeriesEntity {
  /** id */
  id: number;
  /** 剧集名称 */
  name: string;
  /** 剧集季度 */
  season?: string;
  /** 发布时间 */
  pubAt?: Date;
  /** 剧集是否已完结 */
  finished?: boolean;
  /** 完整剧集单集数量 */
  count?: number;
  /** 剧描述称 */
  description?: string;
  /** 创建用户 */
  user?: UserEntity;
  /** 纵向海报图 */
  poster?: FileEntity;
  /** 标签 */
  tags: SeriesTagEntity[];
  /** 创建时间 */
  createAt: Date;
  /** 修改时间 */
  updateAt: Date;
}

export interface SeriesDto {
  name?: string;
  season?: string;
  count?: number;
  finished?: boolean;
  description?: string;
  posterFileId?: string;
  tags?: string[];
}

export interface SeriesQueryDto extends ApiQueryDto<SeriesEntity> {
  keyword?: string;
  name?: string;
  season?: string;
  finished?: 0 | 1;
  tag?: string;
  userId?: number;
  start?: string;
  end?: string;
}

export interface SeriesTagEntity {
  /** 剧集名称 */
  name: string;
  /** 创建时间 */
  createAt: Date;
  /** 修改时间 */
  updateAt: Date;
}

export interface SeriesTagDto {
  name?: string;
}

export interface SeriesTagQueryDto extends ApiQueryDto<SeriesTagEntity> {
  keyword?: string;
}

export interface SeriesSubscribeEntity {
  series?: SeriesEntity;
  notify: boolean;
  createAt: Date;
}

export interface SeriesSubscribeDto {
  notify?: boolean;
}

export interface EpisodeEntity {
  /** id */
  id: number;
  /** 本集标题 */
  title?: string;
  /** 本集集数 */
  no?: string;
  /** 剧集 */
  series: SeriesEntity;
  /** 媒体 */
  media: MediaEntity;
  /** 发布时间 */
  pubAt: Date;
  /** 创建时间 */
  createAt: Date;
  /** 更新时间 */
  updateAt: Date;
}

export interface EpisodeDto {
  title?: string;
  no?: string;
  pubAt?: string;
  seriesId?: number;
  mediaId?: string;
}

export interface EpisodeQueryDto extends ApiQueryDto<EpisodeEntity> {
  keyword?: string;
  seriesId?: number;
  start?: string;
  end?: string;
}
