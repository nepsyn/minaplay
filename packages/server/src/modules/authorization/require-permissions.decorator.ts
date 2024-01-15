import { SetMetadata } from '@nestjs/common';
import { PermissionEnum } from '../../enums/permission.enum.js';

export const REQUIRE_PERMISSIONS_KEY = 'REQUIRE_PERMISSIONS';

/**
 * 接口权限要求
 * @param permissions 要求具有的权限（逻辑或）
 */
export const RequirePermissions = (...permissions: PermissionEnum[]) =>
  SetMetadata(REQUIRE_PERMISSIONS_KEY, permissions);
