import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { Reflector } from '@nestjs/core';
import { ROOM_OWNER_ONLY_KEY } from './room-owner-only.ws.decorator.js';
import { isDefined } from 'class-validator';

@Injectable()
export class LiveAudienceWsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext) {
    const socket: Socket = context.switchToWs().getClient();

    const roomOwnerOnly = this.reflector.get<boolean>(ROOM_OWNER_ONLY_KEY, context.getHandler());
    if (roomOwnerOnly) {
      return socket.data.user && socket.data.live && socket.data.user.id === socket.data.live.user.id;
    }

    return isDefined(socket.data.live);
  }
}
