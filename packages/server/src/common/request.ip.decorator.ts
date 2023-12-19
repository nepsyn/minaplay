import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const RequestIp = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.ips.length ? request.ips[0] : request.ip;
});
