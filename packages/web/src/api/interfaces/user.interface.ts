import { PermissionEnum } from '@/api/enums/permission.enum';
import { FileEntity } from '@/api/interfaces/file.interface';
import { ApiQueryDto } from '@/api/interfaces/common.interface';

export interface UserEntity {
  /** id */
  id: number;
  /** 用户名 */
  username: string;
  /** 创建时间 */
  createAt: Date;
  /** 是否启用通知 */
  notify?: boolean;
  /** 邮箱地址 */
  email?: string;
  /** 修改时间 */
  updateAt: Date;
  /** 头像文件 id */
  avatar?: FileEntity;
  /** 权限列表 */
  permissionNames: PermissionEnum[];
}

export interface UserDto {
  avatarFileId?: string;
  notify?: boolean;
}

export interface UserQueryDto extends ApiQueryDto<UserEntity> {
  keyword?: string;
  username?: string;
}
