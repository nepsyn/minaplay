import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Socket } from 'socket.io';

export const WsLiveCache = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const socket: Socket = ctx.switchToWs().getClient();
  return socket.data.cache;
});
