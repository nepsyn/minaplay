export interface UserEntity {
  /** id */
  id: number;
  /** 用户名 */
  username: string;
  /** 创建时间 */
  createAt: Date;
  /** 修改时间 */
  updateAt: Date;
  /** 头像文件 id */
  avatarFileId: string;
}
