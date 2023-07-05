import { UserEntity } from './user.interface';

export interface SeriesEntity {
  /** id */
  id: number;
  /** 剧集名称 */
  name: string;
  /** 创建用户 */
  user: UserEntity;
  /** 标签 */
  tags: SeriesTagEntity[];
  /** 单集 */
  episodes: EpisodeEntity[];
  /** 剧集描述 */
  description: string;
  /** 创建时间 */
  createAt: Date;
  /** 修改时间 */
  updateAt: Date;

  /** 海报文件 id */
  posterFileId(): string;
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
  /** 标题 */
  title: string;
  /** 本集集数 */
  no?: string;
  /** 创建时间 */
  createAt: Date;
  /** 更新时间 */
  updateAt: Date;
}
