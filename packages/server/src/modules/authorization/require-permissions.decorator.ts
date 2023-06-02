import { SetMetadata } from '@nestjs/common';
import { PermissionEnum } from '../../enums/permission.enum';

export const PERMISSIONS_SYMBOL = Symbol('permissions');

/**
 * 接口权限要求
 * @param permissions 要求具有的权限（逻辑与）
 */
export const RequirePermissions = (...permissions: PermissionEnum[]) => SetMetadata(PERMISSIONS_SYMBOL, permissions);
