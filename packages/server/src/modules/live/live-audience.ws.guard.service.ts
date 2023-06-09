import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { Reflector } from '@nestjs/core';
import { REQUIRE_ADMIN_SYMBOL } from './require-admin.ws.decorator';

@Injectable()
export class LiveAudienceWsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext) {
    const socket: Socket = context.switchToWs().getClient();

    const requireAdmin = this.reflector.get<boolean>(REQUIRE_ADMIN_SYMBOL, context.getHandler());
    if (requireAdmin) {
      return socket.data.user && socket.data.live && socket.data.user.id === socket.data.live.user.id;
    }

    return socket.data.live !== undefined;
  }
}
