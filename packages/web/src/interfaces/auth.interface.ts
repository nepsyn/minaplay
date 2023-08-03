import { UserEntity } from './user.interface';
import { PermissionEnum } from '@/api/enums/permission.enum';

export interface LoginDto {
  username: string;
  password: string;
}

export interface AuthData extends UserEntity {
  token: string;
}

export interface PermissionDto {
  permissionNames: PermissionEnum[];
}
