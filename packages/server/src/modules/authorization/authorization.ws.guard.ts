import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WsException } from '@nestjs/websockets';
import { instanceToPlain } from 'class-transformer';
import { Socket } from 'socket.io';
import { UserService } from '../user/user.service';
import { AuthorizationService } from './authorization.service';
import { buildException } from '../../utils/build-exception.util';
import { ErrorCodeEnum } from '../../enums/error-code.enum';
import { PERMISSIONS_SYMBOL } from './require-permissions.decorator';
import { PermissionEnum } from '../../enums/permission.enum';
import { User } from '../user/user.entity';

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

      socket.data.user = instanceToPlain(user);
    }

    // 所需要权限
    const permissions = this.reflector.get<PermissionEnum[]>(PERMISSIONS_SYMBOL, context.getHandler());
    if (permissions && permissions.length > 0) {
      if (!permissions.some((p) => socket.data.user.permissions.includes(p))) {
        throw buildException(WsException, ErrorCodeEnum.INVALID_TOKEN);
      }
    }

    return true;
  }
}
