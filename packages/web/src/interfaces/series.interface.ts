import { UserEntity } from './user.interface';
import { FileEntity } from '@/interfaces/file.interface';
import { MediaEntity } from '@/interfaces/media.interface';
import { ApiQueryDto } from '@/interfaces/common.interface';

export interface SeriesEntity {
  /** id */
  id: number;
  /** 剧集名称 */
  name: string;
  /** 剧描述称 */
  description?: string;
  /** 创建用户 */
  user: UserEntity;
  /** 纵向海报图 */
  poster?: FileEntity;
  /** 横向海报图 */
  posterLandscape?: FileEntity;
  /** 标签 */
  tags: SeriesTagEntity[];
  /** 创建时间 */
  createAt: Date;
  /** 修改时间 */
  updateAt: Date;
}

export interface SeriesDto {
  name?: string;
  description?: string;
  posterFileId?: string;
  tagIds?: number[];
}

export interface SeriesQueryDto extends ApiQueryDto<SeriesEntity> {
  keyword?: string;
  name?: string;
}

export interface SeriesTagEntity {
  /** id */
  id: number;
  /** 剧集名称 */
  name: string;
  /** 创建时间 */
  createAt: Date;
  /** 修改时间 */
  updateAt: Date;
}

export interface EpisodeEntity {
  /** id */
  id: number;
  /** 本集集数 */
  no?: string;
  /** 媒体 */
  media: MediaEntity;
  /** 剧集 */
  series: SeriesEntity;
  /** 创建时间 */
  createAt: Date;
  /** 更新时间 */
  updateAt: Date;
}

export interface EpisodeDto {
  title?: string;
  no?: string;
  seriesId?: number;
  mediaId?: string;
}

export interface EpisodeQueryDto extends ApiQueryDto<EpisodeEntity> {
  seriesId?: number;
}
