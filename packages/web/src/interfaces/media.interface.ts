import { FileEntity } from '@/interfaces/file.interface';
import { ApiQueryDto } from '@/interfaces/common.interface';

export interface MediaEntity {
  /** id */
  id: string;
  /** 标题 */
  name: string;
  /** 简介 */
  description?: string;
  /** 封面图片 */
  poster?: FileEntity;
  /**对应文件 */
  file?: FileEntity;
  /** 创建时间 */
  createAt: Date;
  /** 更新时间 */
  updateAt: Date;
}

export interface MediaDto {
  name?: string;
  description?: string;
  isPublic?: boolean;
  fileId?: string;
  posterFileId?: string;
}

export interface MediaQueryDto extends ApiQueryDto<MediaEntity> {
  keyword?: string;
  start?: Date;
  end?: Date;
}
