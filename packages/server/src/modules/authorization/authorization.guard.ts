import { CanActivate, ExecutionContext, HttpException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common/exceptions/forbidden.exception.js';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { REQUIRE_PERMISSIONS_KEY } from './require-permissions.decorator.js';
import { User } from '../user/user.entity.js';
import { buildException } from '../../utils/build-exception.util.js';
import { ErrorCodeEnum } from '../../enums/error-code.enum.js';
import { PermissionEnum } from '../../enums/permission.enum.js';

@Injectable()
export class AuthorizationGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      await super.canActivate(context);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw buildException(UnauthorizedException, ErrorCodeEnum.INVALID_TOKEN);
      }
    }

    const permissions = this.reflector.getAllAndMerge<PermissionEnum[]>(REQUIRE_PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (permissions && permissions.length > 0) {
      const user: User = context.switchToHttp().getRequest().user;
      if (!user) {
        throw buildException(UnauthorizedException, ErrorCodeEnum.USER_NOT_LOGGED_IN);
      }

      if (!user.hasOneOf(...permissions)) {
        throw buildException(ForbiddenException, ErrorCodeEnum.NO_PERMISSION);
      }
    }

    return true;
  }
}
