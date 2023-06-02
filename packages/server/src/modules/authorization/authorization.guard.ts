import { CanActivate, ExecutionContext, HttpException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common/exceptions/forbidden.exception';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { PERMISSIONS_SYMBOL } from './require-permissions.decorator';
import { User } from '../user/user.entity';
import { buildException } from '../../utils/build-exception.util';
import { ErrorCodeEnum } from '../../enums/error-code.enum';
import { PermissionEnum } from '../../enums/permission.enum';

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

    const permissions = this.reflector.get<PermissionEnum[]>(PERMISSIONS_SYMBOL, context.getHandler());
    if (permissions && permissions.length > 0) {
      const user: User = context.switchToHttp().getRequest().user;
      if (!user) {
        throw buildException(UnauthorizedException, ErrorCodeEnum.USER_NOT_LOGGED_IN);
      }

      if (permissions.some((p) => !user.permissionNames.includes(p))) {
        throw buildException(ForbiddenException, ErrorCodeEnum.NO_PERMISSION);
      }
    }

    return true;
  }
}
