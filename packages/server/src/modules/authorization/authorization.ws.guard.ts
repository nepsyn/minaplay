import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { UserService } from '../user/user.service.js';
import { AuthorizationService } from './authorization.service.js';
import { buildException } from '../../utils/build-exception.util.js';
import { ErrorCodeEnum } from '../../enums/error-code.enum.js';
import { REQUIRE_PERMISSIONS_KEY } from './require-permissions.decorator.js';
import { PermissionEnum } from '../../enums/permission.enum.js';
import { User } from '../user/user.entity.js';

@Injectable()
export class AuthorizationWsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private authorizationService: AuthorizationService,
    private userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const socket: Socket = context.switchToWs().getClient();

    let payload: Pick<User, 'id' | 'ticket'>;
    try {
      const socket: Socket = context.switchToWs().getClient();
      const token: string = socket.handshake?.headers?.authorization;
      payload = await this.authorizationService.verifyToken(token);
    } catch {
      throw buildException(WsException, ErrorCodeEnum.INVALID_TOKEN);
    }
    if (!payload) {
      throw buildException(WsException, ErrorCodeEnum.INVALID_TOKEN);
    }

    if (!socket.data.user) {
      const user = await this.userService.findOneBy({ id: payload.id });
      if (!user || user.ticket !== payload.ticket) {
        throw buildException(WsException, ErrorCodeEnum.INVALID_TOKEN);
      }

      socket.data.user = user;
    }

    // 所需要权限
    const permissions = this.reflector.get<PermissionEnum[]>(REQUIRE_PERMISSIONS_KEY, context.getHandler());
    if (permissions && permissions.length > 0) {
      if (!permissions.some((p) => socket.data.user.permissionNames.includes(p))) {
        throw buildException(WsException, ErrorCodeEnum.NO_PERMISSION);
      }
    }

    return true;
  }
}
