import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const RequestUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  if (ctx.getType() === 'http') {
    return ctx.switchToHttp().getRequest().user;
  } else if (ctx.getType() === 'ws') {
    return ctx.switchToWs().getClient().data?.user;
  }
});
