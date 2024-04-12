import { ApiQueryDto } from '@/api/interfaces/common.interface';
import { FileSourceEnum } from '@/api/enums/file-source.enum';

export interface FileEntity {
  /** 媒体id */
  id: string;
  /** 文件名 */
  name: string;
  /** 文件大小(字节) */
  size: number;
  /** 文件 md5 */
  md5: string;
  /** 文件 url */
  url?: string;
  /** 文件 mimetype */
  mimetype?: string;
  /** 文件来源 */
  source: FileSourceEnum;
  /** 创建时间 */
  createAt: Date;
  /** 修改时间 */
  updateAt: Date;
}

export interface FileQueryDto extends ApiQueryDto<FileEntity> {
  keyword?: string;
  md5?: string;
  source?: FileSourceEnum;
  userId?: number;
  start?: Date;
  end?: Date;
}
