import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Socket } from 'socket.io';

export const WsLiveState = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const socket: Socket = ctx.switchToWs().getClient();
  return socket.data.state;
});
