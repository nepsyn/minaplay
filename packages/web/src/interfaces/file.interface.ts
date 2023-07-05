export interface FileEntity {
  /** 媒体id */
  id: string;
  /** 文件名 */
  name: string;
  /** 文件大小(字节) */
  size: number;
  /** 文件 md5 */
  md5: string;
  /** 文件 mimetype */
  mimetype?: string;
  /** 创建时间 */
  createAt: Date;
  /** 修改时间 */
  updateAt: Date;
  /** 文件是否过期 */
  isExpired: boolean;
}
