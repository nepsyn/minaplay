import { UserEntity } from './user.interface';
import { PermissionEnum } from '@/api/enums/permission.enum';

export interface LoginDto {
  username: string;
  password: string;
}

export interface EmailBindDto {
  email: string;
}

export interface EmailBindData {
  email: string;
  key: string;
}

export interface EmailVerifyDto {
  key: string;
  code: string;
}

export interface EmailVerifyData {
  old?: string;
  current: string;
}

export interface ChangePasswordDto {
  old?: string;
  current: string;
}

export type ChangePasswordData = ChangePasswordDto;

export interface CreateUserDto {
  username: string;
  password: string;
  permissionNames: PermissionEnum[];
}

export interface AuthData extends UserEntity {
  token: string;
}

export interface PermissionDto {
  permissionNames: PermissionEnum[];
}
