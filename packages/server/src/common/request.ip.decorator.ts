import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const RequestIp = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  if (ctx.getType() === 'http') {
    const request = ctx.switchToHttp().getRequest();
    return request.headers['x-forwarded-for'] ?? request.connection?.remoteAddress ?? request.ip;
  } else if (ctx.getType() === 'ws') {
    const socket = ctx.switchToWs().getClient();
    return socket.handshake?.address;
  }
});
