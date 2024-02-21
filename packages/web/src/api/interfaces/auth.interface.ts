import { UserEntity } from './user.interface';
import { PermissionEnum } from '@/api/enums/permission.enum';
import { AuthActionEnum } from '@/api/enums/auth-action.enum';
import { ApiQueryDto } from '@/api/interfaces/common.interface';

export interface LoginDto {
  username: string;
  password: string;
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

export interface ActionLogEntity {
  id: string;
  ip?: string;
  action: AuthActionEnum;
  operator: UserEntity;
  target: UserEntity;
  extra?: string;
  createAt: Date;
}

export interface ActionLogQueryDto extends ApiQueryDto<ActionLogEntity> {
  operatorId?: number;
  ip?: string;
  action?: AuthActionEnum;
  start?: Date;
  end?: Date;
}
