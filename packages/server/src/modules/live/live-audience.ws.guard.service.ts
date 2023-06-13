import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { Reflector } from '@nestjs/core';
import { CREATOR_ONLY_SYMBOL } from './creator-only.ws.decorator';

@Injectable()
export class LiveAudienceWsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext) {
    const socket: Socket = context.switchToWs().getClient();

    const creatorOnly = this.reflector.get<boolean>(CREATOR_ONLY_SYMBOL, context.getHandler());
    if (creatorOnly) {
      return socket.data.user && socket.data.live && socket.data.user.id === socket.data.live.user.id;
    }

    return socket.data.live !== undefined;
  }
}
